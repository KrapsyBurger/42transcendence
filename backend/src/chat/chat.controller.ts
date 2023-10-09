import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { CreateChannelDto } from './dto';
import { User } from '@prisma/client';
import { ChatGateway } from './chat.gateway';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Patch('read/:id')
  async readMessage(@GetUser() user: User, @Param('id') msgIdString: number) {
    const userId = user.id;
    const msgId = Number(msgIdString);
    if (isNaN(msgId)) {
      throw new BadRequestException('Invalid ID');
    }
    return await this.chatService.readMessage(msgId, userId);
  }

  @Post('channel')
  async createChannel(
    @GetUser() user: User,
    @Body() channelData: CreateChannelDto,
  ) {
    const userId = user.id;
    const createdChannel = await this.chatService.createChannel(
      channelData,
      userId,
    );
    if (createdChannel)
      this.chatGateway.emitJoinChannel(createdChannel.id, userId);
    return createdChannel;
  }

  @Delete('channel/:id')
  async deleteChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: string,
  ) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid ID');
    }
    const { deletedChannel, deletedChannelMembers } =
      await this.chatService.deleteChannel(channelId, currentUserId);
    if (deletedChannel)
      this.chatGateway.emitDeleteChannel(deletedChannel, deletedChannelMembers);
    return deletedChannel;
  }

  @Get('channel/:id')
  async getChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: string) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid ID');
    }
    return await this.chatService.findChannelById(channelId, currentUserId);
  }

  @Patch('channel/:id')
  async updateChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: number,
    @Body()
    body: {
      name?: string;
      password?: string;
      isPrivate?: boolean;
      description?: string;
    },
  ) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    const updatedChannel = await this.chatService.updateChannel(
      channelId,
      currentUserId,
      body,
    );
    if (updatedChannel) this.chatGateway.emitUpdateChannel(channelId, currentUserId);
    return updatedChannel;
  }

  @Get('channels')
  async getPublicChannels() {
    return await this.chatService.getPublicChannels();
  }

  @Get('channels/me')
  async getUserChannels(@GetUser() user: User) {
    const userId = user.id;
    return await this.chatService.getUserChannels(userId);
  }

  @Get('channel/:id/messages')
  async getChannelMessages(
    @GetUser() user: User,
    @Param('id') channelIdString: number,
  ) {
    const userId = user.id;
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid ID');
    }
    return await this.chatService.getChannelMessages(channelId, userId);
  }

  @Post('channel/:id/members')
  async addUserToChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: number,
    @Body() body: { userId: number; password?: string },
  ) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    if (!body.userId || isNaN(body.userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const updatedChannel = await this.chatService.addUserToChannel(
      body.userId,
      channelId,
      currentUserId,
      body.password,
    );
    if (updatedChannel)
      this.chatGateway.emitJoinChannel(channelId, body.userId);
    return updatedChannel;
  }

  @Delete('channel/:id/members')
  async delUserFromChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: number,
    @Body() body: { userId: number },
  ) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    if (!body.userId || isNaN(body.userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const updatedChannel = await this.chatService.delUserFromChannel(
      body.userId,
      channelId,
      currentUserId,
    );
    if (updatedChannel)
      this.chatGateway.emitLeaveChannel(channelId, body.userId);
    return updatedChannel;
  }

  @Post('channel/:id/admins')
  async addAdminToChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: number,
    @Body() body: { userId: number },
  ) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    if (!body.userId || isNaN(body.userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const updatedChannel = await this.chatService.addAdminToChannel(
      body.userId,
      channelId,
      currentUserId,
    );
    if (updatedChannel) this.chatGateway.emitUpdateChannel(channelId, currentUserId);
    return updatedChannel;
  }

  @Post('channel/:id/bans')
  async banFromChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: number,
    @Body() body: { userId: number },
  ) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    if (!body.userId || isNaN(body.userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const updatedChannel = await this.chatService.banFromChannel(
      body.userId,
      channelId,
      currentUserId,
    );
    if (updatedChannel)
      this.chatGateway.emitLeaveChannel(channelId, body.userId);
    return updatedChannel;
  }

  @Delete('channel/:id/bans')
  async unbanFromChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: number,
    @Body() body: { userId: number },
  ) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    if (!body.userId || isNaN(body.userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return await this.chatService.unbanFromChannel(
      body.userId,
      channelId,
      currentUserId,
    );
  }

  @Post('channel/:id/mutes')
  async muteInChannel(
    @GetUser('id') currentUserId: number,
    @Param('id') channelIdString: number,
    @Body() body: { userId: number; muteExpiration: Date },
  ) {
    const channelId = Number(channelIdString);
    if (isNaN(channelId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    if (!body.userId || isNaN(body.userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const muteExpirationDate = new Date(body.muteExpiration);
    if (!body.muteExpiration || isNaN(muteExpirationDate.getTime())) {
      throw new BadRequestException('Invalid mute expiration date');
    }
    const updatedChannel = await this.chatService.muteInChannel(
      body.userId,
      channelId,
      currentUserId,
      muteExpirationDate,
    );
    if (updatedChannel) this.chatGateway.emitUpdateChannel(channelId, currentUserId);
    return updatedChannel;
  }

  @Get(':id')
  async getMessagesBetweenUsers(
    @GetUser('id') currentUserId: number,
    @Param('id') userIdString: number,
  ) {
    const userId = Number(userIdString);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid ID');
    }
    return await this.chatService.getMessagesBetweenUsers(
      currentUserId,
      userId,
    );
  }

  @Post('block/user/:id')
  async blockUser(
    @GetUser('id') currentUserId: number,
    @Param('id') userIdString: number,
  ) {
    const userlId = Number(userIdString);
    if (isNaN(userlId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    const block = await this.chatService.blockUser(currentUserId, userlId);
    if (block) this.chatGateway.emitReloadMessages(currentUserId);
    return block;
  }

  @Delete('block/user/:id')
  async unblockUser(
    @GetUser('id') currentUserId: number,
    @Param('id') userIdString: number,
  ) {
    const userlId = Number(userIdString);
    if (isNaN(userlId)) {
      throw new BadRequestException('Invalid channel ID');
    }
    const block = await this.chatService.unblockUser(currentUserId, userlId);
    if (block) this.chatGateway.emitReloadMessages(currentUserId);
    return block;
  }

  @Get('block/users')
  async getUserBlocks(@GetUser('id') currentUserId: number) {
    return await this.chatService.getBlockedUsersById(currentUserId);
  }

  @Get('block/usersdata')
  async getUserBlocksData(@GetUser('id') currentUserId: number) {
    return await this.chatService.getUserBlocks(currentUserId);
  }
}
