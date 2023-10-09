import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { FriendService } from './friend.service';
import { GetUser } from '../auth/decorator';
import { FriendGateway } from './friend.gateway';

@UseGuards(JwtGuard)
@Controller('friend')
export class FriendController {
  constructor(
    private friendService: FriendService,
    private friendGateway: FriendGateway,
  ) {}

  @Post('request/:receiverId')
  async sendFriendRequest(
    @GetUser('id') senderId: number,
    @Param('receiverId') receiverIdString: string,
  ) {
    const receiverId = Number(receiverIdString);
    if (isNaN(receiverId)) {
      throw new BadRequestException('Invalid ID');
    }
    const friendRequest = await this.friendService.createFriendRequest(
      senderId,
      receiverId,
    );
    if (friendRequest) {
      this.friendGateway.emitUpdateFriendRequests(senderId, receiverId);
      this.friendGateway.emitNotifyFriendRequest(senderId, receiverId );
    }
    return friendRequest;
  }

  @Get('requests')
  async getFriendRequests(@GetUser('id') userId: number) {
    return await this.friendService.getFriendRequests(userId);
  }

  @Post('request/:requestId/accept')
  async acceptFriendRequest(
    @GetUser('id') userId: number,
    @Param('requestId') requestIdString: string,
  ) {
    const requestId = Number(requestIdString);
    if (isNaN(requestId)) {
      throw new BadRequestException('Invalid ID');
    }
    const friendship = await this.friendService.acceptFriendRequest(
      userId,
      requestId,
    );
    if (friendship) {
      this.friendGateway.emitUpdateFriendRequests(
        friendship.user1Id,
        friendship.user2Id,
      );
      this.friendGateway.emitUpdateFriends(
        friendship.user1Id,
        friendship.user2Id,
      );
    }
    return friendship;
  }

  @Delete('request/:requestId')
  async refuseFriendRequest(
    @GetUser('id') userId: number,
    @Param('requestId') requestIdString: string,
  ) {
    const requestId = Number(requestIdString);
    if (isNaN(requestId)) {
      throw new BadRequestException('Invalid ID');
    }
    const deletedFriendRequest = await this.friendService.refuseFriendRequest(
      userId,
      requestId,
    );
    if (deletedFriendRequest) {
      this.friendGateway.emitUpdateFriendRequests(
        deletedFriendRequest.senderId,
        deletedFriendRequest.receiverId,
      );
    }
    return deletedFriendRequest;
  }

  @Get('friends')
  async getFriends(@GetUser('id') userId: number) {
    return await this.friendService.getFriends(userId);
  }

  @Delete(':friendId')
  async deleteFriend(
    @GetUser('id') userId: number,
    @Param('friendId') friendIdString: string,
  ) {
    const friendId = Number(friendIdString);
    if (isNaN(friendId)) {
      throw new BadRequestException('Invalid ID');
    }
    const deletedFriendship = await this.friendService.deleteFriend(
      userId,
      friendId,
    );
    if (deletedFriendship) {
      this.friendGateway.emitUpdateFriends(
        deletedFriendship.user1Id,
        deletedFriendship.user2Id,
      );
    }
    return deletedFriendship;
  }
}
