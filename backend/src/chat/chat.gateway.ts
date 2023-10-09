import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto';
import { UserService } from '../user/user.service';
import { BadRequestException } from '@nestjs/common';
import { Channel, User } from '@prisma/client';
import { ConnectionService, ConnectionStatus, Location } from 'src/connection/connection.service';

@WebSocketGateway({ namespace: '/chat', cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private connectionService: ConnectionService,
  ) {}
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.connectionService.register('/chat', this.server);
    console.log('Chat Socket Server initialized');
  }

  handleConnection(client: Socket) {
    const { userId } = client.handshake.query;
    if (userId) {
      client.join(userId); // user joins a room named by their userId
      console.log('Client connected to chat:', userId);

      // Update connections status
      this.connectionService.updateCurrentLocation(Number(userId), Location.CHAT);
      this.connectionService.updateConnectionStatus(Number(userId), ConnectionStatus.ONLINE);

    }
  }

  async handleDisconnect(client: Socket) {
    const { userId } = client.handshake.query;
    if (typeof userId === 'string') {
      client.leave(userId);
      console.log('Client disconnected from chat:', userId);
    } else {
      console.log('Invalid userId, cannot disconnect client from chat:', userId);
    }

    if (userId && this.connectionService.getCurrentLocation(Number(userId)) === Location.CHAT) { // Set offline only if user was in chat and not in another location
      this.connectionService.updateCurrentLocation(Number(userId), null);
      this.connectionService.updateConnectionStatus(Number(userId), ConnectionStatus.OFFLINE);
    }
  }

  @SubscribeMessage('leaveChannel') // TODO !!!
  handleLeaveChannel(client: Socket, channelId: string) {
    // client.leave(channelId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, payload: CreateMessageDto) {
    console.log('Message received on chat server:', payload);

    // Check if the user is mute before sending the message
    if (payload.isChannelMessage) {
      const mute = await this.chatService.findMute(
        payload.senderId,
        payload.receiverId,
      );
      if (mute) {
        // If muteExpiration is in the future, the user is still mute
        if (mute.muteExpiration > new Date()) {
          throw new BadRequestException(
            'You are currently mute in this channel',
          );
        } else {
          // If muteExpiration is in the past, delete the mute entry
          await this.chatService.delMute(mute.userId, mute.channelId);
        }
      }
    }
    const newMessage = await this.chatService.createMessage(payload);
    if (!newMessage) {
      // if message could not be created
      throw new BadRequestException('Message could not be created');
    }
    // If message is sent to a channel, broadcast to all clients in channel
    if (newMessage.isChannelMessage) {
      const channel = await this.chatService.findChannelById(
        newMessage.receiverId,
        newMessage.senderId,
      );
      if (!channel) {
        throw new BadRequestException('Invalid Channel ID');
      }
      // Check if sender is a member of the channel
      const senderIsMember = channel.members.some(
        (member) => member.id === newMessage.senderId,
      );
      if (!senderIsMember) {
        await this.chatService.deleteMessage(newMessage.id); // Delete message from database
        throw new BadRequestException('Sender is not a member of this channel');
      }
      for (const member of channel.members) {
        this.server.to(member.id.toString()).emit('receiveMessage', newMessage);
      }
    }
    // If message is sent to a user, send to sender and recipient
    else {
      this.server
        .to(newMessage.senderId.toString())
        .emit('receiveMessage', newMessage);
      this.server
        .to(newMessage.receiverId.toString())
        .emit('receiveMessage', newMessage);
    }
  }

  async emitJoinChannel(channelId: number, userId: number) {
    // Get channel
    const channel = await this.chatService.findChannelById(channelId, userId);

    const userJoiningChannel = await this.userService.findUserById(userId);

    // Enrich user with connection status and current location
    const enrichedUserJoiningChannel = await this.chatService.addConnectionStatusAndLocationToUserInfos(userJoiningChannel, userId);

    // Send event to all clients in channel
    for (const member of channel.members) {
      this.server
        .to(member.id.toString())
        .emit('joinChannel', channel, enrichedUserJoiningChannel);
    }
  }

  async emitLeaveChannel(channelId: number, userId: number) {
    // Get channel
    const channel = await this.chatService.findChannelById(channelId, userId);

    const userLeavingChannel = await this.userService.findUserById(userId);

    // Send event to all clients in channel
    for (const member of channel.members) {
      this.server
        .to(member.id.toString())
        .emit('leaveChannel', channel, userLeavingChannel);
    }
    // Also send event to the user who left the channel
    this.server
      .to(userId.toString())
      .emit('leaveChannel', channel, userLeavingChannel);
  }

  async emitDeleteChannel(
    deletedChannel: Channel,
    deletedChannelMembers: User[],
  ) {
    // Send event to all clients in channel
    for (const member of deletedChannelMembers) {
      this.server
        .to(member.id.toString())
        .emit('leaveChannel', deletedChannel, member); // each member is the user who left
    }
  }

  async emitUpdateChannel(channelId: number, userId: number) {
    // Get channel
    const channel = await this.chatService.findChannelById(channelId, userId);

    // Send event to all clients in channel
    for (const member of channel.members) {
      this.server.to(member.id.toString()).emit('updateChannel', channel);
    }
  }

  async emitReloadMessages(userId: number) {
    // Send event to client
    this.server.to(userId.toString()).emit('reloadMessages');
  }

}
