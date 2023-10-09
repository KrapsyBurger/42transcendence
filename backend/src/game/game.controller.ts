import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { GameGateway } from './game.gateway';

@UseGuards(JwtGuard)
@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway,
  ) {}

  @Post('matchmaking')
  async enterMatchmaking(@GetUser('id') userId: number) {
    const game = await this.gameService.enterMatchmaking(userId);
    if (game) {
      // A game was created, start it
      await this.gameGateway.startGame(game.id);
    }
    return game;
  }

  @Delete('matchmaking')
  async leaveMatchmaking(@GetUser('id') userId: number) {
    await this.gameService.leaveMatchmaking(userId);
  }

  @Get()
  async getGame(@GetUser('id') userId: number) {
    return await this.gameService.findGameByUserId(userId);
  }

  @Get('me')
  async getMyGames(@GetUser('id') userId: number) {
    return await this.gameService.findAllGames(userId);
  }

  @Get('invites')
  async getGameInvites(@GetUser('id') userId: number) {
    return await this.gameService.getGameInvites(userId);
  }

  @Get(':userId')
  async getUserGames(@Param('userId') userIdString: string) {
    const userId = Number(userIdString);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid ID');
    }
    return await this.gameService.findAllGames(userId);
  }

  @Post(':gameId/abandon')
  async abandonGame(
    @GetUser('id') userId: number,
    @Param('gameId') gameIdString: string,
  ) {
    const gameId = Number(gameIdString);
    if (isNaN(gameId)) {
      throw new BadRequestException('Invalid ID');
    }
    await this.gameService.abandonGame(userId, gameId);
    await this.gameGateway.endGame(gameId);
    await this.gameService.updateUserGameStats(gameId);
  }

  @Post('invite/:inviteeId')
  async sendGameInvite(
    @GetUser('id') inviterId: number,
    @Param('inviteeId') inviteeIdString: string,
  ) {
    const inviteeId = Number(inviteeIdString);
    if (isNaN(inviteeId)) {
      throw new BadRequestException('Invalid ID');
    }
    const gameInvite = await this.gameService.createGameInvite(
      inviterId,
      inviteeId,
    );
    if (gameInvite) {
      this.gameGateway.emitUpdateGameInvites(inviterId, inviteeId);
    }
    return gameInvite;
  }

  @Post('invite/:gameInviteId/accept')
  async acceptGameInvite(
    @GetUser('id') userId: number,
    @Param('gameInviteId') gameInviteIdString: string,
  ) {
    const gameInviteId = Number(gameInviteIdString);
    if (isNaN(gameInviteId)) {
      throw new BadRequestException('Invalid ID');
    }
    const game = await this.gameService.acceptGameInvite(gameInviteId, userId);
    if (game) {
      this.gameGateway.emitUpdateGameInvites(
        game.firstPlayerId,
        game.secondPlayerId,
      );
      // A game was created, start it
      await this.gameGateway.startGame(game.id);
    }
    return game;
  }

  @Delete('invite/:gameInviteId')
  async refuseGameInvite(
    @GetUser('id') userId: number,
    @Param('gameInviteId') gameInviteIdString: string,
  ) {
    const gameInviteId = Number(gameInviteIdString);
    if (isNaN(gameInviteId)) {
      throw new BadRequestException('Invalid ID');
    }
    const deletedGameInvite = await this.gameService.refuseGameInvite(
      gameInviteId,
      userId,
    );
    if (deletedGameInvite) {
      this.gameGateway.emitUpdateGameInvites(
        deletedGameInvite.inviterId,
        deletedGameInvite.inviteeId,
      );
    }
    return deletedGameInvite;
  }
}
