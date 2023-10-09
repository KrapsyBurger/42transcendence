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

@WebSocketGateway({ namespace: '/profile', cors: true })
export class ProfileGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private connectionService: ConnectionService,
  ) {}
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.connectionService.register('/profile', this.server);
    console.log('Profile Socket Server initialized');
  }

  handleConnection(client: Socket) {
    const { userId } = client.handshake.query;
    if (userId) {
      client.join(userId); // user joins a room named by their userId
      console.log('Client connected to profile:', userId);

      // Update connections status
      this.connectionService.updateCurrentLocation(Number(userId), Location.PROFILE);
      this.connectionService.updateConnectionStatus(Number(userId), ConnectionStatus.ONLINE);
    }
  }

  handleDisconnect(client: Socket) {
    const { userId } = client.handshake.query;
    if (typeof userId === 'string') {
      client.leave(userId);
      console.log('Client disconnected from profile:', userId);
    } else {
      console.log('Invalid userId, cannot disconnect client from profile:', userId);
    }

    // Update connections status
    if (userId && this.connectionService.getCurrentLocation(Number(userId)) === Location.PROFILE) { // Set offline only if user was in profile and not in another location
      this.connectionService.updateCurrentLocation(Number(userId), null);
      this.connectionService.updateConnectionStatus(Number(userId), ConnectionStatus.OFFLINE);
    }
  }

}
