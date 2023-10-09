import { Module, OnModuleInit } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { ConnectionModule } from 'src/connection/connection.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [ConnectionModule, UserModule],
  providers: [GameService, GameGateway ],
  controllers: [GameController],
})
export class GameModule implements OnModuleInit {
  constructor(
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway,
  ) {}

  async onModuleInit() {
	// Find all ongoing games
	const ongoingGames = await this.gameService.findOngoingGames();
	ongoingGames.forEach(async (game) => {
	
    if (game.gameStatus !== 'paused') {
      // Pause the game
      try {
        await this.gameService.pauseGame(game.id, game.firstPlayerId);
      } catch (error) {
        console.error(error);
      }
    }
	  // Restart the game update interval
	  await this.gameGateway.startGame(game.id);
	});
  }
  
}
