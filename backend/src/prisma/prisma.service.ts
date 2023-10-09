import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  async getBlockedUsersById(userId: number) {
    const userBlocks = await this.userBlocks.findMany({
      where: {
        blockerId: userId,
      },
    });
    return userBlocks.map((block) => block.blockedId);
  }

  cleanDb() {
    // Transaction is used to make sure that all the operations are executed or none of them are
    return this.$transaction([
      this.messageRead.deleteMany(),
      this.message.deleteMany(),
      this.channelAdmins.deleteMany(),
      this.channelBans.deleteMany(),
      this.channelMutes.deleteMany(),
      this.channel.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
