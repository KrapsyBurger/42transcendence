import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto, CreateMessageDto } from './dto';
import { ConnectionService } from 'src/connection/connection.service';

const userDataToInclude = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
};

const channelDataToInclude = {
  id: true,
  createdAt: true,
  name: true,
  isPrivate: true,
  description: true,
  ownerId: true,
  owner: {
    select: userDataToInclude,
  },
  password: true, // TO BE REPLACED BY hasPassword
  members: {
    select: userDataToInclude,
  },
  admins: {
    select: {
      userId: true,
      user: {
        select: userDataToInclude,
      },
    },
  },
  bans: {
    select: {
      userId: true,
      user: {
        select: userDataToInclude,
      },
    },
  },
  mutes: {
    select: {
      userId: true,
      muteExpiration: true,
      user: {
        select: userDataToInclude,
      },
    },
  },
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionService: ConnectionService
    ) {}

  async createMessage(messageData: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        content: messageData.content,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        isChannelMessage: messageData.isChannelMessage || false,
      },
    });
  }

  async deleteMessage(msgId: number) {
    const message = await this.prisma.message.delete({
      where: { id: msgId },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async getBlockedUsersById(userId: number) {
    const userBlocks = await this.prisma.userBlocks.findMany({
      where: {
        blockerId: userId,
      },
    });
    return userBlocks.map((block) => block.blockedId);
  }

  // TO DO: Might be useless now (to be checked)
  async getUserBlocks(userId: number) {
    const userBlocks = await this.prisma.userBlocks.findMany({
      where: {
        blockerId: userId,
      },
      include: {
        blocked: {
          select: userDataToInclude,
        },
      },
    });
    return userBlocks;
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number) {
    const blockedUsers = await this.getBlockedUsersById(userId1); // get users blocked by userId1 to filter them out
    const messages = await this.prisma.message.findMany({
      where: {
        isChannelMessage: false, // only get messages between users
        NOT: {
          senderId: { in: blockedUsers }, // filter out blocked users
        },
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: {
        createdAt: 'asc', // sort messages by date ascending
      },
      include: {
        // include sender in the response
        sender: {
          select: userDataToInclude,
        },
      },
    });

    // Add connection info to sender of each message
    const enrichedMessages = await Promise.all(messages.map(async (message) => {
      const enrichedSender = await this.addConnectionStatusAndLocationToUserInfos(message.sender, userId1);
      return {
        ...message,
        sender: enrichedSender
      };
    }));

    // Associate each message with a boolean indicating whether the user has read it
    const messageIds = enrichedMessages.map((message) => message.id);
    const readMessageIds = await this.getMessageReadStatus(userId1, messageIds);

    const messagesWithReadStatus = enrichedMessages.map((message) => ({
      ...message,
      isRead: readMessageIds.has(message.id),
    }));

    return messagesWithReadStatus;
  }

  async readMessage(msgId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: msgId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.messageRead.create({
      data: {
        userId: userId,
        messageId: msgId,
      },
    });
  }

  async createChannel(channelData: CreateChannelDto, userId: number) {
    // Check if channel name is already taken
    const channelName = await this.prisma.channel.findUnique({
      where: {
        name: channelData.name,
      },
    });
    if (channelName) {
      throw new BadRequestException(
        `Channel name ${channelData.name} is already taken`,
      );
    }
    const channel = await this.prisma.channel.create({
      data: {
        ...channelData,
        members: {
          connect: {
            // add the user who created the channel as a member
            id: userId,
          },
        },
      },
    });
    if (!channel) {
      throw new BadRequestException('Channel not created');
    }
    // Creator of the channel is automatically an admin
    await this.prisma.channelAdmins.create({
      data: {
        channelId: channel.id,
        userId: userId,
      },
    });
    return channel;
  }

  async deleteChannel(channelId: number, currentUserId: number) {
    // Check if the currentUser is the owner of the channel
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (channel.ownerId !== currentUserId) {
      throw new BadRequestException('You are not the owner of this channel');
    }

    // Get all messages ids in the channel
    const messages = await this.prisma.message.findMany({
      where: {
        isChannelMessage: true,
        receiverId: channelId,
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
        receiverId: channelId,
      },
    });
    // Delete all channel bans
    await this.prisma.channelBans.deleteMany({
      where: {
        channelId: channelId,
      },
    });
    // Delete all channel admins
    await this.prisma.channelAdmins.deleteMany({
      where: {
        channelId: channelId,
      },
    });
    // Delete all channel mutes
    await this.prisma.channelMutes.deleteMany({
      where: {
        channelId: channelId,
      },
    });

    // Get all channel members
    const deletedChannelMembers = channel.members;
    // Delete the channel
    const deletedChannel = await this.prisma.channel.delete({
      where: { id: channelId },
    });
    return { deletedChannel, deletedChannelMembers };
  }

  async getUserChannels(userId: number) {
    const userWithHisChannels = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        // include the channels the user is a member of
        channels: {
          select: {
            ...channelDataToInclude,
            password: false,
          },
        },
      },
    });
    if (!userWithHisChannels) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

 // Enrich each channel's user data with connection info
  const enrichedChannels = await Promise.all(
    userWithHisChannels.channels.map(async (channel) => {
      
      // Enrich owner
      const enrichedOwner = await this.addConnectionStatusAndLocationToUserInfos(channel.owner, userId);
      
      // Enrich admins
      const enrichedAdmins = await Promise.all(
        channel.admins.map(async (admin) => {
          const enrichedUser = await this.addConnectionStatusAndLocationToUserInfos(admin.user, userId);
          return {
            ...admin,
            user: enrichedUser
          };
        })
      );
      
      // Enrich members
      const enrichedMembers = await Promise.all(
        channel.members.map(async (member) => {
          return await this.addConnectionStatusAndLocationToUserInfos(member, userId);
        })
      );
      
      // Get number of messages unread by user for each channel
      const unreadCount = await this.getUnreadChannelMessageCount(userId, channel.id);
      
      return {
        ...channel,
        owner: enrichedOwner,
        admins: enrichedAdmins,
        members: enrichedMembers,
        unreadCount,
      };
    })
  );
  
  return enrichedChannels;
  }

  async getUnreadChannelMessageCount(userId: number, channelId: number) {
    // get the number of messages sent to the channel that the user has not read and that are not from blocked users
    const blockedUsers = await this.getBlockedUsersById(userId); // get users blocked by userId1 to filter them out
    const unreadCount = await this.prisma.message.count({
      where: {
        receiverId: channelId,
        isChannelMessage: true,
        senderId: {
          not: userId,
          notIn: blockedUsers, // not sent by user
        },
        messageReads: {
          none: {
            // messages that the user has not read
            userId: userId,
          },
        },
      },
    });
    return unreadCount;
  }

  async getChannelMessages(channelId: number, userId: number) {
    const blockedUsers = await this.getBlockedUsersById(userId); // get users blocked by userId1 to filter them out
    const messages = await this.prisma.message.findMany({
      where: {
        receiverId: channelId,
        isChannelMessage: true,
        NOT: {
          senderId: { in: blockedUsers }, // filter out blocked users
        },
      },
      orderBy: {
        createdAt: 'asc', // sort messages by date ascending
      },
      include: {
        // include sender in the response
        sender: {
          select: userDataToInclude,
        },
      },
    });

    // Add connection info to sender of each message
    const enrichedMessages = await Promise.all(messages.map(async (message) => {
      const enrichedSender = await this.addConnectionStatusAndLocationToUserInfos(message.sender, userId);
      return {
        ...message,
        sender: enrichedSender
      };
    }));

    // Associate each message with a boolean indicating whether the user has read it
    const messageIds = enrichedMessages.map((message) => message.id);
    const readMessageIds = await this.getMessageReadStatus(userId, messageIds);

    const messagesWithReadStatus = enrichedMessages.map((message) => ({
      ...message,
      isRead: readMessageIds.has(message.id),
    }));

    return messagesWithReadStatus;
  }

  // get the ids of messages that the user has read
  async getMessageReadStatus(userId: number, messageIds: number[]) {
    const readMessages = await this.prisma.messageRead.findMany({
      where: {
        AND: [{ messageId: { in: messageIds } }, { userId: userId }],
      },
      select: {
        messageId: true,
      },
    });
    const readMessageIds = new Set(
      readMessages.map((readMessage) => readMessage.messageId),
    );
    return readMessageIds;
  }

  async findChannelById(channelId: number, currentUserId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: channelId,
      },
      select: channelDataToInclude,
    });
    if (!channel) {
      throw new NotFoundException(`channel with id ${channelId} not found`);
    }
  // Enrich owner with connection info
  const enrichedOwner = await this.addConnectionStatusAndLocationToUserInfos(channel.owner, currentUserId);
    
  // Enrich admins with connection info
  const enrichedAdmins = await Promise.all(
    channel.admins.map(async (admin) => {
      return {
        ...admin,
        user: await this.addConnectionStatusAndLocationToUserInfos(admin.user, currentUserId),
      };
    })
  );

  // Enrich members with connection info
  const enrichedMembers = await Promise.all(
    channel.members.map(async (member) => {
      return await this.addConnectionStatusAndLocationToUserInfos(member, currentUserId);
    })
  );

  const channelWithHasPassword = {
    ...channel,
    hasPassword: !!channel.password,
    owner: enrichedOwner,
    admins: enrichedAdmins,
    members: enrichedMembers,
    // Keeping bans and mutes as they are
    bans: channel.bans,
    mutes: channel.mutes
  };

  delete channelWithHasPassword.password;

  return channelWithHasPassword;
  }

  async getPublicChannels() {
    const channels = await this.prisma.channel.findMany({
      where: {
        isPrivate: false,
      },
      orderBy: {
        createdAt: 'asc', // sort channels by date ascending
      },
      select: channelDataToInclude,
    });

    // add hasPassword field to each channel to indicate if the channel has a password or not
    const channelsWithHasPassword = channels.map((channel) => {
      const { password, ...channelWithoutPassword } = channel; // remove password field from channel object
      return {
        ...channelWithoutPassword,
        hasPassword: !!channel.password, // !! converts a value to boolean --> if password is null, it becomes false, otherwise true
      };
    });

    return channelsWithHasPassword;
  }

  async addUserToChannel(
    userId: number,
    channelId: number,
    currentUserId: number,
    password?: string,
  ) {
    // Check if user and channel exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (!currentUser) {
      throw new NotFoundException(`User with id ${currentUserId} not found`);
    }
    if (!channel) {
      throw new NotFoundException(`Channel with id ${channelId} not found`);
    }

    // Check if user is already a member of the channel
    const isMember = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });
    if (isMember) {
      throw new BadRequestException(
        `User with id ${userId} is already a member of channel with id ${channelId}`,
      );
    }

    // Check if user was banned from the channel
    const isBanned = await this.prisma.channelBans.findFirst({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });
    if (isBanned) {
      throw new BadRequestException(
        `User with id ${userId} was banned from channel with id ${channelId}`,
        'banned_user',
      );
    }

    // Check if user was invited by currentUser in the channel and that currentUser is an admin
    const isAdmin = await this.prisma.channelAdmins.findFirst({
      where: {
        channelId: channelId,
        userId: currentUserId,
      },
    });
    if (channel.isPrivate && !isAdmin) {
      throw new BadRequestException(`Channel with id ${channelId} is private`);
    }

    // Check if channel has a password, and if so, check if the password is correct
    if (channel.password) {
      // Check if currentUser is already a member of the channel
      const isCurrentUserMember = await this.prisma.channel.findFirst({
        where: {
          id: channelId,
          members: {
            some: {
              id: currentUserId,
            },
          },
        },
      });
      if (!isCurrentUserMember && !password) {
        throw new BadRequestException(
          `Channel with id ${channelId} requires a password`,
        );
      }
      if (!isCurrentUserMember && channel.password !== password) {
        console.log(channel.password, password);
        throw new BadRequestException(
          `Incorrect password for channel with id ${channelId}`,
        );
      }
    }

    // Add user to channel
    return await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
    });
  }

  async addAdminToChannel(
    userId: number,
    channelId: number,
    currentUserId: number,
  ) {
    // Check if user and channel exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (!currentUser) {
      throw new NotFoundException(`User with id ${currentUserId} not found`);
    }
    if (!channel) {
      throw new NotFoundException(`Channel with id ${channelId} not found`);
    }

    // Check if user is already a member of the channel
    const isMember = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });
    if (!isMember) {
      throw new BadRequestException(
        `User with id ${userId} is not a member of channel with id ${channelId}`,
      );
    }

    // Check if user is already an admin of the channel
    const isAdmin = await this.prisma.channelAdmins.findFirst({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });
    if (isAdmin) {
      throw new BadRequestException(
        `User with id ${userId} is already an admin of channel with id ${channelId}`,
      );
    }

    // Check if currentUser is the owner of the channel
    if (channel.ownerId !== currentUserId) {
      throw new BadRequestException(
        `User with id ${currentUserId} is not the owner of channel with id ${channelId}`,
      );
    }

    // Promote user to admin
    return await this.prisma.channelAdmins.create({
      data: {
        userId: userId,
        channelId: channelId,
      },
    });
  }

  async updateChannel(
    channelId: number,
    currentUserId: number,
    body: {
      name?: string;
      password?: string;
      isPrivate?: boolean;
      description?: string;
    },
  ) {
    // Check if channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException(`Channel with id ${channelId} not found`);
    }

    // Check if currentUser is the owner of the channel
    if (channel.ownerId !== currentUserId) {
      throw new BadRequestException(
        `User with id ${currentUserId} is not the owner of channel with id ${channelId}`,
      );
    }

    // Update channel
    return await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        ...body,
      },
    });
  }

  async delUserFromChannel(
    userId: number,
    channelId: number,
    currentUserId: number,
  ) {
    // Check if user and channel exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (!currentUser) {
      throw new NotFoundException(`User with id ${currentUserId} not found`);
    }
    if (!channel) {
      throw new NotFoundException(`Channel with id ${channelId} not found`);
    }

    // Check if user is already a member of the channel
    const isMember = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });
    if (!isMember) {
      throw new BadRequestException(
        `User with id ${userId} is not a member of channel with id ${channelId}`,
      );
    }

    // Check if currentUser is an admin of the channel or user is trying to leave the channel
    const isAdmin = await this.prisma.channelAdmins.findFirst({
      where: {
        channelId: channelId,
        userId: currentUserId,
      },
    });
    if (!isAdmin && userId !== currentUserId) {
      throw new BadRequestException(
        `User with id ${currentUserId} is not an admin of channel with id ${channelId}`,
      );
    }

    // Check if user to remove is not the owner of the channel
    if (channel.ownerId === userId) {
      throw new BadRequestException(
        `User with id ${userId} is the owner of channel with id ${channelId}`,
      );
    }

    // If user was an admin, remove from admins as well
    await this.prisma.channelAdmins.deleteMany({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });

    // Remove user from channel
    return await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
    });
  }

  async banFromChannel(
    userId: number,
    channelId: number,
    currentUserId: number,
  ) {
    // Check if user and channel exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (!currentUser) {
      throw new NotFoundException(`User with id ${currentUserId} not found`);
    }
    if (!channel) {
      throw new NotFoundException(`Channel with id ${channelId} not found`);
    }

    // Check if user is already a member of the channel
    const isMember = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });
    if (!isMember) {
      throw new BadRequestException(
        `User with id ${userId} is not a member of channel with id ${channelId}`,
      );
    }

    // Check if user is already banned from the channel
    const isBanned = await this.prisma.channelBans.findFirst({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });
    if (isBanned) {
      throw new BadRequestException(
        `User with id ${userId} is already banned from channel with id ${channelId}`,
      );
    }

    // Check if currentUser is an admin of the channel
    const isAdmin = await this.prisma.channelAdmins.findFirst({
      where: {
        channelId: channelId,
        userId: currentUserId,
      },
    });
    if (!isAdmin) {
      throw new BadRequestException(
        `User with id ${currentUserId} is not an admin of channel with id ${channelId}`,
      );
    }

    // Check if user to ban is not the owner of the channel
    if (channel.ownerId === userId) {
      throw new BadRequestException(
        `User with id ${userId} is the owner of channel with id ${channelId}`,
      );
    }

    // Kick user from channel
    this.delUserFromChannel(userId, channelId, currentUserId);

    // Ban user from channel
    return await this.prisma.channelBans.create({
      data: {
        userId: userId,
        channelId: channelId,
      },
    });
  }

  async unbanFromChannel(
    userId: number,
    channelId: number,
    currentUserId: number,
  ) {
    // Check if user and channel exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (!currentUser) {
      throw new NotFoundException(`User with id ${currentUserId} not found`);
    }
    if (!channel) {
      throw new NotFoundException(`Channel with id ${channelId} not found`);
    }

    // Check if user is already banned from the channel
    const isBanned = await this.prisma.channelBans.findFirst({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });
    if (!isBanned) {
      throw new BadRequestException(
        `User with id ${userId} is not banned from channel with id ${channelId}`,
      );
    }

    // Check if currentUser is an admin of the channel
    const isAdmin = await this.prisma.channelAdmins.findFirst({
      where: {
        channelId: channelId,
        userId: currentUserId,
      },
    });
    if (!isAdmin) {
      throw new BadRequestException(
        `User with id ${currentUserId} is not an admin of channel with id ${channelId}`,
      );
    }

    // Unban user from channel
    return await this.prisma.channelBans.deleteMany({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });
  }

  async muteInChannel(
    userId: number,
    channelId: number,
    currentUserId: number,
    muteExpiration: Date,
  ) {
    // Check if user and channel exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (!currentUser) {
      throw new NotFoundException(`User with id ${currentUserId} not found`);
    }
    if (!channel) {
      throw new NotFoundException(`Channel with id ${channelId} not found`);
    }

    // Check if user is already a member of the channel
    const isMember = await this.prisma.channel.findFirst({
      where: {
        id: channelId,
        members: {
          some: {
            id: userId,
          },
        },
      },
    });
    if (!isMember) {
      throw new BadRequestException(
        `User with id ${userId} is not a member of channel with id ${channelId}`,
      );
    }

    // Check if user is already muted from the channel
    const isMuted = await this.prisma.channelMutes.findFirst({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });
    if (isMuted) {
      // Delete old mute if expired
      if (isMuted.muteExpiration < new Date()) {
        await this.prisma.channelMutes.deleteMany({
          where: {
            channelId: channelId,
            userId: userId,
          },
        });
      } // Throw error if mute is still active
      else
        throw new BadRequestException(
          `User with id ${userId} is already muted from channel with id ${channelId}`,
        );
    }

    // Check if currentUser is an admin of the channel
    const isAdmin = await this.prisma.channelAdmins.findFirst({
      where: {
        channelId: channelId,
        userId: currentUserId,
      },
    });
    if (!isAdmin) {
      throw new BadRequestException(
        `User with id ${currentUserId} is not an admin of channel with id ${channelId}`,
      );
    }

    // Check if user to mute is not the owner of the channel
    if (channel.ownerId === userId) {
      throw new BadRequestException(
        `User with id ${userId} is the owner of channel with id ${channelId}`,
      );
    }

    // Mute user from channel
    return await this.prisma.channelMutes.create({
      data: {
        userId: userId,
        channelId: channelId,
        muteExpiration: muteExpiration,
      },
    });
  }

  async findMute(userId: number, channelId: number) {
    return await this.prisma.channelMutes.findFirst({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });
  }

  async delMute(userId: number, channelId: number) {
    return await this.prisma.channelMutes.deleteMany({
      where: {
        channelId: channelId,
        userId: userId,
      },
    });
  }

  async blockUser(userId: number, blockedUserId: number) {
    // Prevent user from blocking himself
    if (userId === blockedUserId) {
      throw new BadRequestException(
        `User with id ${userId} cannot block himself`,
      );
    }
    // Check if user and blockedUser exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const blockedUser = await this.prisma.user.findUnique({
      where: { id: blockedUserId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (!blockedUser) {
      throw new NotFoundException(`User with id ${blockedUserId} not found`);
    }
    // Check if user is already blocked by blockedUser
    const isBlocked = await this.prisma.userBlocks.findFirst({
      where: {
        blockerId: userId,
        blockedId: blockedUserId,
      },
    });
    if (isBlocked) {
      throw new BadRequestException(
        `User with id ${userId} is already blocked by user with id ${blockedUserId}`,
      );
    }
    // Block user
    return await this.prisma.userBlocks.create({
      data: {
        blockerId: userId,
        blockedId: blockedUserId,
      },
    });
  }

  async unblockUser(userId: number, blockedUserId: number) {
    // Check if blockedUser is blocked by user
    const isBlocked = await this.prisma.userBlocks.findFirst({
      where: {
        blockerId: userId,
        blockedId: blockedUserId,
      },
    });
    if (!isBlocked) {
      throw new BadRequestException(
        `User with id ${userId} is not blocked by user with id ${blockedUserId}`,
      );
    }
    // Unblock user
    return await this.prisma.userBlocks.deleteMany({
      where: {
        blockerId: userId,
        blockedId: blockedUserId,
      },
    });
  }

  async addConnectionStatusAndLocationToUserInfos(userToEnrich: any, userIdAsking: number): Promise<any> {
    // Check if userToEnrich is the user asking for the info, or a friend of his
    const isFriend = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            user1Id: userToEnrich.id,
            user2Id: userIdAsking,
          },
          {
            user1Id: userIdAsking,
            user2Id: userToEnrich.id,
          },
        ],
      },
    });
    if (isFriend || userToEnrich.id === userIdAsking) {
      const connectionStatus = this.connectionService.getConnectionStatus(userToEnrich.id);
      const currentLocation = this.connectionService.getCurrentLocation(userToEnrich.id);
      return {
        ...userToEnrich,
        connectionStatus,
        currentLocation
      };
    } else {
      return userToEnrich;
    }
  }
  
}
