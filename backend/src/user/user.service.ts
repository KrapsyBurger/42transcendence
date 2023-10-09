import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto';
import * as argon from 'argon2';

const userDataToInclude = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  isTwoFactorAuthenticationEnabled: true,
  numberOfGamesPlayed: true,
  numberOfWins: true,
};

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
      select: userDataToInclude,
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async editUser(userId: number, dto: EditUserDto) {
    const { password, ...rest } = dto;

    const hash = password ? await argon.hash(dto.password) : undefined; // hash new password if it exists

    delete dto.password; // delete password from dto

    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto, // spread operator to copy all properties from dto
        hash: hash || undefined, // if hash is undefined, it will not be updated
      },
      select: userDataToInclude,
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }

  async deleteUser(userId: number) {
    // Get channels owned by user to delete them
    const ownedChannels = await this.prisma.channel.findMany({
      where: {
        ownerId: userId,
      },
    });

    // For each channel, delete the related entries
    for (const channel of ownedChannels) {
      // Get all messages ids in the channel
      const messages = await this.prisma.message.findMany({
        where: {
          isChannelMessage: true,
          receiverId: channel.id,
        },
        select: { id: true }, // Only select the ids
      });
      const messageIds = messages.map((m) => m.id);
      // Delete all associated MessageRead entries
      await this.prisma.messageRead.deleteMany({
        where: { messageId: { in: messageIds } },
      });
      // Delete all messages in the channel
      await this.prisma.message.deleteMany({
        where: {
          isChannelMessage: true,
          receiverId: channel.id,
        },
      });
      await this.prisma.channelAdmins.deleteMany({
        where: {
          channelId: channel.id,
        },
      });
      await this.prisma.channelBans.deleteMany({
        where: {
          channelId: channel.id,
        },
      });
      await this.prisma.channelMutes.deleteMany({
        where: {
          channelId: channel.id,
        },
      });
      // Finally delete the channel
      await this.prisma.channel.delete({
        where: {
          id: channel.id,
        },
      });
    }

    // Delete message reads
    await this.prisma.messageRead.deleteMany({
      where: {
        userId: userId,
      },
    });

    // Delete messages sent by user
    await this.prisma.message.deleteMany({
      where: {
        senderId: userId,
      },
    });

    // Delete user
    const user = await this.prisma.user.delete({
      where: { id: userId },
      select: userDataToInclude,
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return user;
  }

  async findAllUsers(userId: number) {
    const blockedUsers = await this.prisma.getBlockedUsersById(userId);
    const users = await this.prisma.user.findMany({
      select: userDataToInclude,
    });

    const usersWithUnreadCount = await Promise.all(
      users.map(async (user) => {
        if (blockedUsers.some((blockedUser) => blockedUser === user.id)) {
          // If the user is blocked, set unreadCount to 0
          return { ...user, unreadCount: 0 };
        } else {
          const unreadCount = await this.getUnreadPrivateMessageCount(
            user.id,
            userId,
          );
          return { ...user, unreadCount };
        }
      }),
    );
    return usersWithUnreadCount;
  }

  async getUnreadPrivateMessageCount(senderId: number, receiverId: number) {
    // count all messages sent by senderId to receiverId that have not been read by receiverId
    const unreadCount = await this.prisma.message.count({
      where: {
        senderId: senderId,
        receiverId: receiverId,
        isChannelMessage: false,
        messageReads: {
          none: {
            // none of the messageReads have userId = receiverId
            userId: receiverId,
          },
        },
      },
    });
    return unreadCount;
  }
}
