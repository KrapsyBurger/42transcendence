import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConnectionService, ConnectionStatus, Location } from 'src/connection/connection.service';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({ namespace: '/friend', cors: true })
export class FriendGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly prisma: PrismaService,
    private connectionService: ConnectionService,
  ) {}
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.connectionService.register('/friend', this.server);
    console.log('Friend Socket Server initialized');
  }

  handleConnection(client: Socket) {
    const { userId } = client.handshake.query;
    if (userId) {
      client.join(userId); // user joins a room named by their userId
      console.log('Client connected to friend:', userId);

      // Update connections status
      this.connectionService.updateCurrentLocation(Number(userId), Location.FRIENDS);
      this.connectionService.updateConnectionStatus(Number(userId), ConnectionStatus.ONLINE);
    }
  }

  handleDisconnect(client: Socket) {
    const { userId } = client.handshake.query;
    if (typeof userId === 'string') {
      client.leave(userId);
      console.log('Client disconnected from friend:', userId);
    } else {
      console.log('Invalid userId, cannot disconnect client from friend:', userId);
    }

    if (userId && this.connectionService.getCurrentLocation(Number(userId)) === Location.FRIENDS) { // Set offline only if user was in friends and not in another location
      this.connectionService.updateCurrentLocation(Number(userId), null);
      this.connectionService.updateConnectionStatus(Number(userId), ConnectionStatus.OFFLINE);
    }
  }

  async emitUpdateFriendRequests(userId1: number, userId2: number) {
    this.server.to(userId1.toString()).emit('updateFriendRequests');
    this.server.to(userId2.toString()).emit('updateFriendRequests');
  }

  async emitUpdateFriends(userId1: number, userId2: number) {
    this.server.to(userId1.toString()).emit('updateFriends');
    this.server.to(userId2.toString()).emit('updateFriends');
  }

  async emitNotifyFriendRequest(senderId: number, receiverId: number) {
    //Find sender username
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true },
    });
    const senderUsername = sender.username;

    this.connectionService.emitToUserInAllNamespaces(receiverId, 'notifyFriendRequest', senderUsername);
  }

}
