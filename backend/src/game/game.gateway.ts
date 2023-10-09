import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { NotFoundException } from '@nestjs/common';
import { ConnectionService, ConnectionStatus, Location } from 'src/connection/connection.service';

@WebSocketGateway({ namespace: '/game', cors: true })
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private updateIntervals: Map<number, NodeJS.Timeout>;

  constructor(
    private gameService: GameService,
    private connectionService: ConnectionService,
    ) {
    this.updateIntervals = new Map<number, NodeJS.Timeout>();
  }

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.connectionService.register('/game', this.server);
    console.log('Game Socket Server initialized');
  }

  async handleConnection(client: Socket) {
    const { userId } = client.handshake.query;
    if (userId){
      client.join(userId); // user joins a room named by their userId
      console.log(`Client connected to game: ${userId}`);

      // Update location to INGAME or GAME
      // Check if the user is currently in a game
      const game = await this.gameService.findGameByUserId(Number(userId));
      if (game && game.gameStatus !== 'over'){
        this.connectionService.updateCurrentLocation(Number(userId), Location.INGAME);
      }
      else {
        this.connectionService.updateCurrentLocation(Number(userId), Location.GAME);
      }
      this.connectionService.updateConnectionStatus(Number(userId), ConnectionStatus.ONLINE); // Update connection status
    }
  }

  async handleDisconnect(client: Socket) {
    const { userId } = client.handshake.query;
    if (typeof userId === 'string') {
      client.leave(userId);
      this.gameService.leaveMatchmaking(Number(userId));
      const game = await this.gameService.findGameByUserId(Number(userId));
      if (game && game.gameStatus !== 'paused') {
        // If user is in a game, pause it
        try {
          await this.gameService.pauseGame(game.id, Number(userId));
        } catch (error) {
          console.error(error);
        }
      }
      console.log('Client disconnected from game:', userId);
    } else {
      console.log(
        'Invalid userId, cannot disconnect client from game:',
        userId,
      );
    }

    // Update location to null
    if (userId && ( this.connectionService.getCurrentLocation(Number(userId)) === Location.GAME || this.connectionService.getCurrentLocation(Number(userId))  === Location.INGAME )) { // Set offline only if user was in game and not in another location
      this.connectionService.updateCurrentLocation(Number(userId), null);
      this.connectionService.updateConnectionStatus(Number(userId), ConnectionStatus.OFFLINE);
    }
  }

  async emitUpdateGame(gameId: number) {
    // Get game
    const game = await this.gameService.findGameById(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    // Don't emit if game is over
    if (game.gameStatus === 'over') {
      return;
    }
    this.server.to(game.firstPlayerId.toString()).emit('updateGame', game); //TODO: only share relevant data !!!
    this.server.to(game.secondPlayerId.toString()).emit('updateGame', game);
  }

  async startGame(gameId: number) {
    if (!this.updateIntervals.has(gameId)) {
      this.gameService.randomInitialMove();
      // Update game state regularly
      const interval = setInterval(async () => {
        let ret;
        try {
          ret = await this.gameService.updateGameState(gameId);
        } catch (error) {
          console.error(error);
        }
        if (ret === 'over') {
          // If game is over
          await this.gameService.updateUserGameStats(gameId);
          await this.endGame(gameId);
        } else await this.emitUpdateGame(gameId);
      }, 10);

      this.updateIntervals.set(gameId, interval);
    }

    // Update location to INGAME for both players
    const game = await this.gameService.findGameById(gameId);
    if (game) {
      this.connectionService.updateCurrentLocation(game.firstPlayerId, Location.INGAME);
      this.connectionService.updateCurrentLocation(game.secondPlayerId, Location.INGAME);
    }
  }

  async endGame(gameId: number) {
    // Remove game from update intervals
    clearInterval(this.updateIntervals.get(gameId));
    this.updateIntervals.delete(gameId);

    // Get game
    const game = await this.gameService.findGameByIdWithWinner(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    // Emit endGame event to clients
    this.server.to(game.firstPlayerId.toString()).emit('endGame', game);
    this.server.to(game.secondPlayerId.toString()).emit('endGame', game);

    // Update location to GAME for both players
    this.connectionService.updateCurrentLocation(game.firstPlayerId, Location.GAME);
    this.connectionService.updateCurrentLocation(game.secondPlayerId, Location.GAME);
  }

  @SubscribeMessage('readyToResume')
  async handleReadyToResume(client: Socket, payload: any) {
    const { gameId, userId } = payload;
    console.log('readyToResume event received', gameId, userId);
    try {
      await this.gameService.resumeGame(payload.gameId, payload.userId);
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('pauseGame')
  async handlePauseGame(client: Socket, payload: any) {
    const { gameId, userId } = payload;
    console.log('pauseGame event received', gameId, userId);
    try {
      await this.gameService.pauseGame(payload.gameId, payload.userId);
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('movePaddle')
  async handleMovePaddle(client: Socket, payload: any) {
    const { direction, userId, gameId } = payload;
    // console.log('paddleMove event received', gameId, userId, direction);
    try {
      await this.gameService.movePaddle(direction, userId, gameId);
    } catch (error) {
      console.error(error);
    }
  }

  async emitUpdateGameInvites(userId1: number, userId2: number) {
    console.log('emitUpdateGameInvites', userId1, userId2);
    this.server.to(userId1.toString()).emit('updateGameInvites');
    this.server.to(userId2.toString()).emit('updateGameInvites');
  }
}
