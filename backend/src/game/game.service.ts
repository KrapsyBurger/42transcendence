import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
export class GameService {
  private queue: number[] = [];
  private move: { stepX: number; stepY: number };
  private movePaddleAmount: number;
  private bottomBoundary: number;
  private topBoundary: number;
  private leftBoundary: number;
  private rightBoundary: number;
  private defaultBallPosition: { x: number; y: number };
  private playerHeight: number;
  private player1x: number;
  private player2x: number;

  constructor(private readonly prisma: PrismaService) {
    this.move = { stepX: -0.0025, stepY: 0.0025 }; // previous -0.005, 0.005
    this.movePaddleAmount = 0.04;
    this.bottomBoundary = 0.985; // 1
    this.topBoundary = 0;
    this.leftBoundary = 0;
    this.rightBoundary = 0.985; //1
    this.defaultBallPosition = { x: 0.5, y: 0.5 };
    this.playerHeight = 0.2; // height of the paddle, in percentage of the game height
    this.player1x = 0.03; //0.1
    this.player2x = 0.965; //0.9
  }

  async enterMatchmaking(userId: number) {
    // Check if user is already in queue
    const index = this.queue.findIndex((id) => id === userId);
    if (index !== -1) {
      throw new BadRequestException('Already in queue');
    }
    // Check if user is already in a game that is not finished
    const game = await this.prisma.game.findFirst({
      where: {
        OR: [{ firstPlayerId: userId }, { secondPlayerId: userId }],
        gameStatus: {
          not: 'over',
        },
      },
    });
    if (game) {
      throw new BadRequestException('Already in a game');
    }
    // Add user to queue
    this.queue.push(userId);

    if (this.queue.length >= 2) {
      // If queue is 2 or more players
      const player1Id = this.queue.shift(); // get first player from queue
      const player2Id = this.queue.shift(); // get second player from queue
      // Check if players are the same
      if (player1Id === player2Id) {
        throw new BadRequestException('Players are the same');
      }
      // Check if players exist
      const player1 = await this.prisma.user.findUnique({
        where: {
          id: player1Id,
        },
      });
      const player2 = await this.prisma.user.findUnique({
        where: {
          id: player2Id,
        },
      });
      if (!player1 || !player2) {
        // Remove players from queue if they don't exist
        if (!player1) this.leaveMatchmaking(player1Id);
        if (!player2) this.leaveMatchmaking(player2Id);
        throw new NotFoundException('Player not found');
      }
      // Check if players are already in a game that is not finished
      const player1Game = await this.prisma.game.findFirst({
        where: {
          OR: [{ firstPlayerId: player1Id }, { secondPlayerId: player1Id }],
          gameStatus: {
            not: 'over',
          },
        },
      });
      const player2Game = await this.prisma.game.findFirst({
        where: {
          OR: [
            {
              firstPlayerId: player2Id,
            },
            {
              secondPlayerId: player2Id,
            },
          ],
          gameStatus: {
            not: 'over',
          },
        },
      });
      if (player1Game || player2Game) {
        // Remove players from queue
        if (player1Game) this.leaveMatchmaking(player1Id);
        if (player2Game) this.leaveMatchmaking(player2Id);
        throw new BadRequestException('Player already in a game');
      }
      // TODO: CHECK IF PLAYERS ARE ONLINE !!! REMOVE FROM QUEUE IF NOT

      // Create new Game instance
      const game = await this.createGameInstance(player1Id, player2Id);

      // Remove players from queue
      this.leaveMatchmaking(player1Id);
      this.leaveMatchmaking(player2Id);
      return game;
    }
    return null; // return null if there are not enough players in queue
  }

  async createGameInstance(player1Id: number, player2Id: number) {
    const game = await this.prisma.game.create({
      data: {
        firstPlayer: {
          connect: {
            id: player1Id,
          },
        },
        secondPlayer: {
          connect: {
            id: player2Id,
          },
        },
        firstPlayerPoints: 0,
        secondPlayerPoints: 0,
        gameType: 'matchmaking',
        gameStatus: 'paused',
        firstPlayerPaddleY:
          (this.bottomBoundary - this.topBoundary) / 2 - this.playerHeight / 2,
        secondPlayerPaddleY:
          (this.bottomBoundary - this.topBoundary) / 2 - this.playerHeight / 2,
        ballX: this.defaultBallPosition.x,
        ballY: this.defaultBallPosition.y,
        isReadyFirstPlayer: false,
        isReadySecondPlayer: false,
      },
    });
    return game;
  }

  async leaveMatchmaking(userId: number) {
    // Remove user from queue
    const index = this.queue.findIndex((id) => id === userId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  async findGameById(gameId: number) {
    return await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
  }

  async findGameByIdWithWinner(gameId: number) {
    return await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        winner: {
          select: userDataToInclude,
        },
      },
    });
  }

  async findGameByUserId(userId: number) {
    return await this.prisma.game.findFirst({
      where: {
        OR: [{ firstPlayerId: userId }, { secondPlayerId: userId }],
        gameStatus: {
          not: 'over',
        },
      },
    });
  }

  async findAllGames(userId: number) {
    const games = await this.prisma.game.findMany({
      where: {
        OR: [{ firstPlayerId: userId }, { secondPlayerId: userId }],
        // gameStatus: {
        //   not: 'playing',
        // },
      },
    });

    const enrichedGames = await Promise.all(
      games.map(async (game) => {
        const firstPlayer = await this.prisma.user.findUnique({
          where: { id: game.firstPlayerId },
          select: { username: true, avatar: true },
        });

        const secondPlayer = await this.prisma.user.findUnique({
          where: { id: game.secondPlayerId },
          select: { username: true, avatar: true },
        });

        return {
          ...game,
          firstPlayerUsername: firstPlayer?.username || '',
          firstPlayerAvatar: firstPlayer?.avatar || '',
          secondPlayerUsername: secondPlayer?.username || '',
          secondPlayerAvatar: secondPlayer?.avatar || '',
        };
      }),
    );
    return enrichedGames;
  }

  async updateGameState(gameId: number) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    // Check if game is paused
    if (game.gameStatus === 'paused') {
      return null; // do nothing if game is paused
    }
    // Check if game is already over
    if (game.gameStatus === 'over') {
      return 'already_over';
    }
    // Check if game is over according to points
    if (game.firstPlayerPoints >= 10 || game.secondPlayerPoints >= 10) {
      // Determine winner
      let winnerId = null;
      let loserId = null;
      if (game.firstPlayerPoints >= 10) {
        winnerId = game.firstPlayerId;
        loserId = game.secondPlayerId;
      } else if (game.secondPlayerPoints >= 10) {
        winnerId = game.secondPlayerId;
        loserId = game.firstPlayerId;
      }
      // Set game status to over and end game
      await this.prisma.game.update({
        where: {
          id: gameId,
        },
        data: {
          gameStatus: 'over',
          winnerId: winnerId,
        },
      });
      console.log('Game has been ended because of points');
      return 'over';
    }

    this.check(game);
    const newBallX = game.ballX + this.move.stepX;
    const newBallY = game.ballY + this.move.stepY;

    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        ballX: newBallX,
        ballY: newBallY,
        firstPlayerPoints: game.firstPlayerPoints,
        secondPlayerPoints: game.secondPlayerPoints,
      },
    });
    return null;
  }

  randomInitialMove() {
    const moves = [
      { stepX: 0.004, stepY: 0.0025 }, // previous: 0.005, 0.005
      { stepX: 0.0025, stepY: 0.005 }, // previous: 0.005, 0.01
      { stepX: 0.005, stepY: 0.0025 }, // previous 0.01, 0.005
      { stepX: -0.004, stepY: -0.0025 }, // previous -0.005, -0.005
      { stepX: -0.003, stepY: 0.0025 }, // previous -0.005, 0.005
    ];
    let initialMove = moves[Math.floor(Math.random() * moves.length)];
    this.move = initialMove;
  }

  check(game: any) {
    this.checkPlayerBoundaries(game);
    this.checkGoals(game);
    this.checkBallBoundaries(game);
  }

  checkBallBoundaries(game: any) {
    if (game.ballY + this.move.stepY >= this.bottomBoundary) {
      if (this.move.stepY > 0)
        this.move = { stepX: this.move.stepX, stepY: -1 * this.move.stepY };
    }
    if (game.ballY - this.move.stepY <= this.topBoundary) {
      if (this.move.stepY < 0)
        this.move = { stepX: this.move.stepX, stepY: -1 * this.move.stepY };
    }
    if (game.ballX - this.move.stepX <= this.leftBoundary) {
      if (this.move.stepX < 0)
        this.move = { stepX: -1 * this.move.stepX, stepY: this.move.stepY };
    }
    if (game.ballX + this.move.stepX >= this.rightBoundary) {
      if (this.move.stepX > 0)
        this.move = { stepX: -1 * this.move.stepX, stepY: this.move.stepY };
    }
  }

  checkGoals(game: any) {
    if (game.ballX - this.move.stepX <= this.leftBoundary) {
      game.secondPlayerPoints = game.secondPlayerPoints + 1;
      game.ballX = this.defaultBallPosition.x;
      game.ballY = this.defaultBallPosition.y;
      this.randomInitialMove();
    }
    if (game.ballX + this.move.stepX >= this.rightBoundary) {
      game.firstPlayerPoints = game.firstPlayerPoints + 1;
      game.ballX = this.defaultBallPosition.x;
      game.ballY = this.defaultBallPosition.y;
      this.randomInitialMove();
    }
  }

  checkPlayerBoundaries(game: any) {
    if (game.ballX - this.move.stepX <= this.player1x) {
      if (
        game.ballY <= game.firstPlayerPaddleY + this.playerHeight &&
        game.ballY >= game.firstPlayerPaddleY
      ) {
        if (this.move.stepX < 0)
          this.move = { stepX: -1 * this.move.stepX, stepY: this.move.stepY };
      }
    }
    if (game.ballX + this.move.stepX >= this.player2x) {
      if (
        game.ballY <= game.secondPlayerPaddleY + this.playerHeight &&
        game.ballY >= game.secondPlayerPaddleY
      ) {
        if (this.move.stepX > 0)
          this.move = { stepX: -1 * this.move.stepX, stepY: this.move.stepY };
      }
    }
  }

  async abandonGame(userId: number, gameId: number) {
    const game = await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
    // Check if game exists
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    // Check if game is already over
    if (game.gameStatus === 'over') {
      throw new BadRequestException('Game already over');
    }
    // Check if user is in game
    if (game.firstPlayerId !== userId && game.secondPlayerId !== userId) {
      throw new BadRequestException('User not in game');
    }
    // Set game status to over
    await this.prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        gameStatus: 'over',
        winnerId:
          game.firstPlayerId === userId
            ? game.secondPlayerId
            : game.firstPlayerId, // Set winner to other player
      },
    });
    console.log('Game has been abandoned');
  }

  async resumeGame(gameId: number, userId: number) {
    const game = await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
    // Check if game exists
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    // Check if game is already over
    if (game.gameStatus === 'over') {
      throw new BadRequestException('Game already over');
    }
    // Check if user is in game
    if (game.firstPlayerId !== userId && game.secondPlayerId !== userId) {
      throw new BadRequestException('User not in game');
    }
    // Check if game is already started
    if (game.gameStatus === 'playing') {
      throw new BadRequestException('Game already started');
    }
    // Set player as ready
    let bothPlayersReady = false;
    if (game.firstPlayerId === userId) {
      await this.prisma.game.update({
        where: {
          id: gameId,
        },
        data: {
          isReadyFirstPlayer: true,
        },
      });
      if (game.isReadySecondPlayer) bothPlayersReady = true;
    }
    if (game.secondPlayerId === userId) {
      await this.prisma.game.update({
        where: {
          id: gameId,
        },
        data: {
          isReadySecondPlayer: true,
        },
      });
      if (game.isReadyFirstPlayer) bothPlayersReady = true;
    }
    console.log('Are they both ready? ', bothPlayersReady);
    // Check if both players are ready
    if (bothPlayersReady) {
      // Resume game
      await this.prisma.game.update({
        where: {
          id: gameId,
        },
        data: {
          gameStatus: 'playing',
        },
      });
      console.log('Game has been resumed');
    }
  }

  async pauseGame(gameId: number, userId: number) {
    const game = await this.prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
    // Check if game exists
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    // Check if game is already over
    if (game.gameStatus === 'over') {
      throw new BadRequestException('Game already over');
    }
    // Check if user is in game
    if (game.firstPlayerId !== userId && game.secondPlayerId !== userId) {
      throw new BadRequestException('User not in game');
    }
    // Check if game is already paused
    if (game.gameStatus === 'paused') {
      throw new BadRequestException('Game already paused');
    }
    // Pause game
    await this.prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        gameStatus: 'paused',
        // Reset ready status
        isReadyFirstPlayer: false,
        isReadySecondPlayer: false,
      },
    });
    console.log('Game has been paused');
  }

  async movePaddle(direction: string, userId: number, gameId: number) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    let newPaddleY;
    if (userId === game.firstPlayerId) {
      // If user is first player
      newPaddleY = this.calculateNewPaddleY(game.firstPlayerPaddleY, direction);
      if (newPaddleY !== game.firstPlayerPaddleY)
        await this.prisma.game.update({
          where: { id: gameId },
          data: {
            firstPlayerPaddleY: newPaddleY,
          },
        });
    } else if (userId === game.secondPlayerId) {
      // If user is second player
      newPaddleY = this.calculateNewPaddleY(
        game.secondPlayerPaddleY,
        direction,
      );
      if (newPaddleY !== game.secondPlayerPaddleY)
        await this.prisma.game.update({
          where: { id: gameId },
          data: {
            secondPlayerPaddleY: newPaddleY,
          },
        });
    } else {
      throw new BadRequestException('User not in game');
    }
  }

  calculateNewPaddleY(currentPaddleY: number, direction: string) {
    let newPaddleY = currentPaddleY;
    if (
      direction === 'up' &&
      currentPaddleY - this.movePaddleAmount > this.topBoundary
    ) {
      newPaddleY -= this.movePaddleAmount;
    } else if (
      direction === 'down' &&
      currentPaddleY + this.playerHeight + this.movePaddleAmount <
        this.bottomBoundary
    ) {
      newPaddleY += this.movePaddleAmount;
    }
    return newPaddleY;
  }

  async findOngoingGames() {
    return await this.prisma.game.findMany({
      where: {
        gameStatus: {
          not: 'over',
        },
      },
    });
  }

  async createGameInvite(inviterId: number, inviteeId: number) {
    // Check if inviter and invitee are the same
    if (inviterId === inviteeId) {
      throw new BadRequestException('Cannot invite yourself');
    }
    // Check if inviter and invitee exist
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
    });
    const invitee = await this.prisma.user.findUnique({
      where: { id: inviteeId },
    });
    if (!inviter || !invitee) {
      throw new NotFoundException('User not found');
    }
    // Check if inviter and invitee are already in a game that is not finished
    const inviterGame = await this.prisma.game.findFirst({
      where: {
        OR: [{ firstPlayerId: inviterId }, { secondPlayerId: inviterId }],
        gameStatus: {
          not: 'over',
        },
      },
    });
    const inviteeGame = await this.prisma.game.findFirst({
      where: {
        OR: [{ firstPlayerId: inviteeId }, { secondPlayerId: inviteeId }],
        gameStatus: {
          not: 'over',
        },
      },
    });
    if (inviterGame || inviteeGame) {
      throw new BadRequestException('Inviter or invitee already in a game');
    }
    // Check if inviter is in matchmaking queue, if so remove them
    const inviterIndex = this.queue.findIndex((id) => id === inviterId);
    if (inviterIndex !== -1) {
      this.queue.splice(inviterIndex, 1);
    }
    // Check if a game invite already exists between the two users
    const gameInvite = await this.prisma.gameInvite.findFirst({
      where: {
        OR: [
          { inviterId: inviterId, inviteeId: inviteeId },
          { inviterId: inviteeId, inviteeId: inviterId },
        ],
      },
    });
    if (gameInvite) {
      throw new BadRequestException('Game invite already exists');
    }

    // Create a new game invite
    return await this.prisma.gameInvite.create({
      data: {
        inviter: {
          connect: {
            id: inviterId,
          },
        },
        invitee: {
          connect: {
            id: inviteeId,
          },
        },
      },
    });
  }

  async acceptGameInvite(gameInviteId: number, inviteeId: number) {
    // Check if user exists
    const invitee = await this.prisma.user.findUnique({
      where: { id: inviteeId },
    });
    if (!invitee) {
      throw new NotFoundException('User not found');
    }
    console.log('gameInviteId: ', gameInviteId);
    // Find the game invite
    const gameInvite = await this.prisma.gameInvite.findUnique({
      where: { id: gameInviteId },
    });
    // Check if game invite exists
    if (!gameInvite) {
      throw new NotFoundException('Game invite not found');
    }
    // Check if invitee is the user who was invited
    if (gameInvite.inviteeId !== inviteeId) {
      throw new BadRequestException('User not invited to game');
    }
    // Check if inviter and invitee are the same
    if (gameInvite.inviterId === inviteeId) {
      throw new BadRequestException('Cannot invite yourself');
    }
    // Check if inviter or invitee are already in a game that is not finished
    const inviterGame = await this.prisma.game.findFirst({
      where: {
        OR: [
          { firstPlayerId: gameInvite.inviterId },
          { secondPlayerId: gameInvite.inviterId },
        ],
        gameStatus: {
          not: 'over',
        },
      },
    });
    const inviteeGame = await this.prisma.game.findFirst({
      where: {
        OR: [
          { firstPlayerId: gameInvite.inviteeId },
          { secondPlayerId: gameInvite.inviteeId },
        ],
        gameStatus: {
          not: 'over',
        },
      },
    });
    if (inviterGame || inviteeGame) {
      throw new BadRequestException('Inviter or invitee already in a game');
    }
    // Check if inviter or invitee are in matchmaking queue, if so remove them
    const inviterIndex = this.queue.findIndex(
      (id) => id === gameInvite.inviterId,
    );
    if (inviterIndex !== -1) {
      this.queue.splice(inviterIndex, 1);
    }
    const inviteeIndex = this.queue.findIndex(
      (id) => id === gameInvite.inviteeId,
    );
    if (inviteeIndex !== -1) {
      this.queue.splice(inviteeIndex, 1);
    }
    // TODO: Check if inviter and invitee are online, if not remove game invite !!!

    // Delete the game invite
    await this.prisma.gameInvite.delete({
      where: { id: gameInviteId },
    });
    // Create a new game instance
    return await this.createGameInstance(
      gameInvite.inviterId,
      gameInvite.inviteeId,
    );
  }

  async refuseGameInvite(gameInviteId: number, inviteeId: number) {
    // Check if user exists
    const invitee = await this.prisma.user.findUnique({
      where: { id: inviteeId },
    });
    if (!invitee) {
      throw new NotFoundException('User not found');
    }
    // Find the game invite
    const gameInvite = await this.prisma.gameInvite.findUnique({
      where: { id: gameInviteId },
    });
    // Check if game invite exists
    if (!gameInvite) {
      throw new NotFoundException('Game invite not found');
    }
    // Check if invitee is the user who was invited
    if (gameInvite.inviteeId !== inviteeId) {
      throw new BadRequestException('User not invited to game');
    }
    // Delete the game invite
    return await this.prisma.gameInvite.delete({
      where: { id: gameInviteId },
    });
  }

  async updateUserGameStats(gameId: number) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    // Update user stats
    let winnerId = game.winnerId;
    let loserId = null;
    if (winnerId == game.firstPlayerId)
      loserId = game.secondPlayerId
    else
      loserId = game.firstPlayerId

    const winner = await this.prisma.user.findUnique({
      where: { id: winnerId },
    });
    const loser = await this.prisma.user.findUnique({
      where: { id: loserId },
    });

    await this.prisma.user.update({
      where: { id: winnerId },
      data: {
        numberOfGamesPlayed: winner.numberOfGamesPlayed + 1,
        numberOfWins: winner.numberOfWins + 1,
      },
    });
    await this.prisma.user.update({
      where: { id: loserId },
      data: {
        numberOfGamesPlayed: loser.numberOfGamesPlayed + 1,
      },
    });
  }

  async getGameInvites(userId: number) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Get game invites
    return await this.prisma.gameInvite.findMany({
      where: {
        OR: [{ inviterId: userId }, { inviteeId: userId }],
      },
      include: {
        inviter: {
          select: userDataToInclude,
        },
        invitee: {
          select: userDataToInclude,
        },
      },
    });
  }
}
