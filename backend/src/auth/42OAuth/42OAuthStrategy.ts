import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-42';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OAuthStrategy extends PassportStrategy(Strategy, '42') {
  constructor(
    private readonly authService: AuthService,
    readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.get('42API_UID'),
      clientSecret: configService.get('42API_SECRET'),
      callbackURL: configService.get('42API_CALLBACK'),
      scope: ['public'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    console.log(profile);
    const signinInfos = await this.authService.validate42user({
      email: profile.emails[0].value,
      username: profile.username,
      avatar: profile._json.image.link,
      password: '',
      firstName: profile._json.first_name,
      lastName: profile._json.last_name,
      isTwoFAActivated: false,
    });
    return signinInfos;
  }
}
