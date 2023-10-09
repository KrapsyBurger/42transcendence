import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { signinDto, signupDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { NotFoundError } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: signupDto) {
    // generate password hash
    const hash = await argon.hash(dto.password);

    try {
      // save new user in DB
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          hash,
          avatar: dto.avatar || this.config.get('BASE_AVATAR_LINK'),
          isTwoFactorAuthenticationEnabled: dto.isTwoFAActivated,
          twoFactorAuthenticationSecret: '',
          isQrCodeScanned: false,
        },
      });

      delete user.hash;

      // return id of the new user
      return { userId: user.id };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          // duplicate field
          throw new ForbiddenException('Credentials taken');
      }
      throw error;
    }
  }

  async signin(dto: signinDto) {
    // find the user by email
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });
    // if user does not exist throw exception
    if (!user) throw new ForbiddenException('Credentials incorrect');

    // compare password
    const pwMatches = await argon.verify(user.hash, dto.password);
    // if password incorrect throw exception
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    // Check if 2FA is enabled, return 2FA infos and not token
    if (user.isTwoFactorAuthenticationEnabled) {
      return {
        userId: user.id,
        isTwoFactorAuthenticationEnabled: user.isTwoFactorAuthenticationEnabled,
        isQrCodeScanned: user.isQrCodeScanned,
      };
    }

    // return signed token
    return await this.signToken(user.id, user.username);
  }

  async signToken(userId: number, username: string) {
    const payload = { sub: userId, username };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '120m', //TODO: change for evaluation !!!
      secret: secret,
    });

    return { access_token: token, userId: userId };
  }

  async validate42user(dto: signupDto) {
    const userEmail = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (userEmail)
      return await this.signToken(userEmail.id, userEmail.username);
    const usernameNotUnique = await this.prisma.user.findUnique({
      ////// find if the username already exists in the db
      where: {
        username: dto.username,
      },
    });
    let newUser = null;
    if (usernameNotUnique) {
      newUser = await this.prisma.user.create({
        data: {
          username: `${dto.username}${usernameNotUnique.id + 1}`, ////// join user found + id if username already existed in the db
          hash: '',
          email: dto.email,
          avatar: dto.avatar,
          firstName: dto.firstName,
          lastName: dto.lastName,
          isTwoFactorAuthenticationEnabled: false,
          twoFactorAuthenticationSecret: '',
          isQrCodeScanned: false,
        },
      });
    } else {
      newUser = await this.prisma.user.create({
        data: {
          username: dto.username,
          hash: '',
          email: dto.email,
          avatar: dto.avatar,
          firstName: dto.firstName,
          lastName: dto.lastName,
          isTwoFactorAuthenticationEnabled: false,
          twoFactorAuthenticationSecret: '',
          isQrCodeScanned: false,
        },
      });
    }
    return await this.signToken(newUser.id, newUser.username);
  }

  async set2FASecret(secret: string, userId: number) {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        twoFactorAuthenticationSecret: secret,
      },
    });
    return updatedUser;
  }

  async generate2FASecret(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const secret = authenticator.generateSecret();

    const otpauthUrl = authenticator.keyuri(
      user.email,
      'ft_transcendence',
      secret,
    );

    await this.set2FASecret(secret, user.id);

    return {
      secret,
      otpauthUrl,
    };
  }

  async generateQrCodeURL(otpAuthUrl: string) {
    return toDataURL(otpAuthUrl);
  }

  async QrCodeAlreadyScanned(userId: number) {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isQrCodeScanned: true,
      },
    });
  }

  async is2FACodeValid(twoFactorAuthenticationCode: string, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const verif = await authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorAuthenticationSecret,
    });
    return verif;
  }

  async login2FA(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return await this.signToken(user.id, user.username);
  }
}
