import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { UserService } from '../user/user.service';
import { ConnectionModule } from 'src/connection/connection.module';

@Module({
  imports: [ConnectionModule],
  providers: [ChatGateway, ChatService, UserService],
  controllers: [ChatController],
})
export class ChatModule {}
