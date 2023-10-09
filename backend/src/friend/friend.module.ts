import { Module } from '@nestjs/common';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { FriendGateway } from './friend.gateway';
import { ConnectionModule } from 'src/connection/connection.module';

@Module({
  imports: [ConnectionModule],
  controllers: [FriendController],
  providers: [FriendService, FriendGateway],
  exports: [FriendService]
})
export class FriendModule {}
