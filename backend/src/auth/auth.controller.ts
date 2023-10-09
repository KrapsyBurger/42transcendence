import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { signinDto, signupDto } from './dto';
import { OAuthGuard } from './guard';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { localhost } from 'src/main';

interface SignInInfos {
  access_token: string;
  userId: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('signup')
  signup(@Body() dto: signupDto) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: signinDto) {
    return this.authService.signin(dto);
  }

  ///////////////////////////////////////////

  @Get('42')
  @UseGuards(OAuthGuard)
  handleLogin() {
    return { msg: '42 auth' };
  }

  @Get('42/callback')
  @UseGuards(OAuthGuard)
  handlecallback(@Req() req: Request, @Res() res: Response) {
    const signinInfos = req.user as SignInInfos; // cast req.user into SignInInfos
    const token = signinInfos.access_token;
    const userId = signinInfos.userId;
    console.log('token and userId', token, userId);
    res.redirect(`http://${localhost}:3000/42token/${token}/${userId}`);
  }

  /////////////////////////////////////////

  @Post('2fa/generateQR')
  async generate2FAQRCode(@Body() body) {
    const userId = body.userId;
    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('Invalid userId');
    }
    const TwoFASecret = this.authService.generate2FASecret(userId);

    return this.authService.generateQrCodeURL((await TwoFASecret).otpauthUrl);
  }

  @Post('2fa/firstQrScan')
  async QrCodeAlreadyScanned(@Body() body) {
    const twoFactorAuthenticationCode = body.twoFactorAuthenticationCode;
    if (!twoFactorAuthenticationCode) {
      throw new UnauthorizedException('Invalid authentication code');
    }
    const userId = body.userId;
    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('Invalid userId');
    }
    const isCodeValid = await this.authService.is2FACodeValid(
      twoFactorAuthenticationCode,
      userId,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    return await this.authService.QrCodeAlreadyScanned(userId);
  }

  @Post('2fa/authenticate')
  @HttpCode(200)
  async authenticate(@Body() body) {
    const twoFactorAuthenticationCode = body.twoFactorAuthenticationCode;
    if (!twoFactorAuthenticationCode) {
      throw new UnauthorizedException('Invalid authentication code');
    }
    const userId = body.userId;
    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('Invalid userId');
    }
    const isCodeValid = await this.authService.is2FACodeValid(
      twoFactorAuthenticationCode,
      userId,
    );

    if (isCodeValid === false) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    return this.authService.login2FA(userId);
  }
}
