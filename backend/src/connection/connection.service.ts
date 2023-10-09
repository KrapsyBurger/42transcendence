import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Server } from 'socket.io';

enum ConnectionStatus {
  ONLINE,
  OFFLINE
}

enum Location {
  CHAT,
  GAME,
  INGAME,
  PROFILE,
  FRIENDS,
}
export { ConnectionStatus, Location };

const userDataToInclude = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
};

@Injectable()
export class ConnectionService {
  private servers: { [namespace: string]: Server } = {};
  private usersConnectionStatus: Map<number, ConnectionStatus> = new Map();
  private usersCurrentLocation: Map<number, Location> = new Map();

  constructor(
    private prisma: PrismaService,
  ) {}

  getConnectionStatus(userId: number) {
    const status = this.usersConnectionStatus.get(userId);
    if (status === undefined) {
      return ConnectionStatus.OFFLINE;
    }
    return status;
  }

  getCurrentLocation(userId: number) {
    const location = this.usersCurrentLocation.get(userId);
    if (location === undefined) {
      return null;
    }
    return location;
  }

  register(namespace: string, server: Server) {
    this.servers[namespace] = server;
  }

  updateConnectionStatus(userId: number, status: ConnectionStatus) {
    // console.log('UPDATING CONNECTION STATUS', userId, ConnectionStatus[status]);
    this.usersConnectionStatus.set(userId, status);
    this.emitUpdateConnectionStatus(userId, status);
  }

  updateCurrentLocation(userId: number, location: Location) {
    // console.log('UPDATING CURRENT LOCATION', userId, Location[location]);
    this.usersCurrentLocation.set(userId, location);
    this.emitUpdateCurrentLocation(userId, location);
  }

  emitToAllNamespaces(event: string, data: any) {
    for (const namespace in this.servers) {
      this.servers[namespace].emit(event, data);
    }
  }

  async emitToFriendsInAllNamespaces(userId: number, event: string, data: any) {
    const friends = await this.getFriends(userId);
    for (const friend of friends) {
      this.emitToUserInAllNamespaces(friend.id, event, data);
    }
  }

  emitToUserInAllNamespaces(userId: Number, event: string, data: any) {
    for (const namespace in this.servers) {
      this.servers[namespace].to(userId.toString()).emit(event, data);
    }
  }  

  emitUpdateConnectionStatus(userId: number, status: ConnectionStatus) {
    // console.log('EMITTING UPDATE CONNECTION STATUS', userId, status);
    // this.emitToAllNamespaces('updateConnectionStatus', { userId, status });

    // Emit to friends
    this.emitToFriendsInAllNamespaces(userId, 'updateConnectionStatus', { userId, status });
    // Also emit to user
    this.emitToUserInAllNamespaces(userId, 'updateConnectionStatus', { userId, status });
  }

  emitUpdateCurrentLocation(userId: number, location: Location) {
    // console.log('EMITTING UPDATE CURRENT LOCATION', userId, location);
    // this.emitToAllNamespaces('updateCurrentLocation', { userId, location });

    // Emit to friends
    this.emitToFriendsInAllNamespaces(userId, 'updateCurrentLocation', { userId, location });
    // Also emit to user
    this.emitToUserInAllNamespaces(userId, 'updateCurrentLocation', { userId, location });
  }

  async getFriends(userId: number) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Get friends
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: userDataToInclude,
        },
        user2: {
          select: userDataToInclude,
        },
      },
    });
    // Get only the friends
    const friends = friendships.map((friendship) => {
      return friendship.user1Id === userId
        ? { ...friendship.user2 }
        : { ...friendship.user1 };
    });

    return friends;
  }
}


