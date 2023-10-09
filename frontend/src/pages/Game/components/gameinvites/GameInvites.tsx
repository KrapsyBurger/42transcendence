// Styles
// import { GameInvitesPageContainer, GameInvitesTableContainer } from "./GameInvites.styles";
import { GameInvitesTable } from "./subcomponents/GameInvitesTable";

import { Socket } from "socket.io-client";

interface GameInvitesProps {
  socket: Socket | null;
}

const GameInvites = ({ socket }: GameInvitesProps) => {
  return (
    // <GameInvitesPageContainer>
      // <GameInvitesTableContainer>
        <GameInvitesTable socket={socket} />
      // </GameInvitesTableContainer>
    // </GameInvitesPageContainer>
  );
};

export default GameInvites;
