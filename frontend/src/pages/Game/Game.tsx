import SideBar from "../../components/sidebar/SideBar";
import { GameContentContainer, GamePageContainer } from "./Game.styles";
import GameWithRouter from "./GameContent";

const Game = () => {
  return (
    <GamePageContainer>
      <SideBar />
      <GameContentContainer>
        <GameWithRouter />
      </GameContentContainer>
    </GamePageContainer>
  );
};

export default Game;
