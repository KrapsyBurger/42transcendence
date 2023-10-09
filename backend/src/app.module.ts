import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';
import { FriendModule } from './friend/friend.module';
import { ConnectionModule } from './connection/connection.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    PrismaModule,
    ChatModule,
    GameModule,
    AuthModule,
    UserModule,
    ConfigModule.forRoot({ isGlobal: true }),
    FriendModule,
    ConnectionModule,
    ProfileModule,
  ],
  providers: [],
})
export class AppModule {}
