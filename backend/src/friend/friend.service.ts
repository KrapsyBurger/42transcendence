import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { use } from 'passport';
import { ConnectionService } from 'src/connection/connection.service';
import { PrismaService } from 'src/prisma/prisma.service';

const userDataToInclude = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
};

@Injectable()
export class FriendService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: ConnectionService
    ) {}

  async createFriendRequest(senderId: number, receiverId: number) {
    // Check if sender and receiver are the same
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }
    // Check if sender and receiver exist
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }
    // Check if already friends
    const alreadyFriends = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });
    if (alreadyFriends) {
      throw new BadRequestException('Already friends');
    }
    // Check if friend request already exists
    const alreadyRequested = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
    if (alreadyRequested) {
      throw new BadRequestException('Already requested');
    }
    // Create friend request
    return this.prisma.friendRequest.create({
      data: {
        sender: {
          connect: { id: senderId },
        },
        receiver: {
          connect: { id: receiverId },
        },
      },
    });
  }

  async getFriendRequests(userId: number) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Get friend requests received or sent by user
    return await this.prisma.friendRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: userDataToInclude,
        },
        receiver: {
          select: userDataToInclude,
        },
      },
    });
  }

  async acceptFriendRequest(userId: number, requestId: number) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Check if friend request exists
    const friendRequest = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }
    // Check if user is the receiver of the friend request
    if (friendRequest.receiverId !== userId) {
      throw new BadRequestException(
        'User is not the receiver of the friend request',
      );
    }
    // Check if already friends
    const alreadyFriends = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            user1Id: friendRequest.senderId,
            user2Id: friendRequest.receiverId,
          },
          {
            user1Id: friendRequest.receiverId,
            user2Id: friendRequest.senderId,
          },
        ],
      },
    });
    if (alreadyFriends) {
      // Delete friend request
      await this.prisma.friendRequest.delete({
        where: { id: requestId },
      });
      throw new BadRequestException('Already friends');
    }
    // Create friendship
    const friendship = await this.prisma.friendship.create({
      data: {
        user1: {
          connect: { id: friendRequest.senderId },
        },
        user2: {
          connect: { id: friendRequest.receiverId },
        },
      },
    });
    // Delete friend request
    await this.prisma.friendRequest.delete({
      where: { id: requestId },
    });
    return friendship;
  }

  async refuseFriendRequest(userId: number, requestId: number) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Check if friend request exists
    const friendRequest = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }
    // Check if user is the receiver of the friend request
    if (
      friendRequest.receiverId !== userId &&
      friendRequest.senderId !== userId
    ) {
      throw new BadRequestException(
        'User is not the receiver nor the sender of the friend request',
      );
    }
    // Delete friend request
    return await this.prisma.friendRequest.delete({
      where: { id: requestId },
    });
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

    // Enrich friends with connection status and location
    const enrichedFriends = await Promise.all(
      friends.map(async (friend) => {
        return await this.addConnectionStatusAndLocationToUserInfos(friend);
      })
    );

    return enrichedFriends;
  }

  async deleteFriend(userId: number, friendId: number) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Check if friend exists
    const friend = await this.prisma.user.findUnique({
      where: { id: friendId },
    });
    if (!friend) {
      throw new NotFoundException('Friend not found');
    }
    // Check if already friends
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });
    if (!friendship) {
      throw new BadRequestException('Not friends');
    }
    // Delete friendship
    return await this.prisma.friendship.delete({
      where: {
        id: friendship.id,
      },
    });
  }

  async addConnectionStatusAndLocationToUserInfos(user: any): Promise<any> {
    const connectionStatus = this.connectionService.getConnectionStatus(user.id);
    const currentLocation = this.connectionService.getCurrentLocation(user.id);
    return {
      ...user,
      connectionStatus,
      currentLocation
    };
  }
}
