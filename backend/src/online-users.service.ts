import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlineUsersService {
  private connectedUsers: Map<number, boolean> = new Map();

  markUserAsConnected(userId: number) {
    this.connectedUsers.set(userId, true);
  }

  markUserAsDisconnected(userId: number) {
    this.connectedUsers.delete(userId);
  }

  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}
