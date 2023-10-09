import styled from "styled-components";
import { MainContainer } from "../../components/maincontainer/MainContainer.styles";

export const GamePageContainer = styled(MainContainer)`
  grid-template-columns: 200px 1fr;
  grid-template-rows: 1fr;
  grid-template-areas:
    "leftsidebar main"
`;

export const GameContentContainer = styled.div`
  grid-area: main;
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
`;
export const GameTitleContainer = styled.div`
  grid-area: gametitle; /* Set grid-area to match */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
`;

export const GameContainer = styled.div`
  display: grid; /* Use grid display */
  grid-template-columns: 1fr 4fr 1fr;
  grid-template-rows: 1fr 1fr 1fr 8fr 1fr;
  grid-template-areas:
    ". gametitle ."
    ". gamesubtitle ."
    ". gameactions ."
    ". gamecourt gameswitches"
    ". gameinstructions .";
`;

export const GameSubTitleContainer = styled.div`
  grid-area: gamesubtitle; /* Set grid-area to match */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
`;

export const GameActionsContainer = styled.div`
  grid-area: gameactions; /* Set grid-area to match */
  display: flex;
  flex-direction: row;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
`;

export const GameSwitchesContainer = styled.div`
  grid-area: gameswitches; /* Set grid-area to match */
  margin-left: 20px;
  `;

export const GameCourtContainer = styled.div`
  grid-area: gamecourt; /* Set grid-area to match */
  position: relative;
  border: 1px solid #000;
  width: 600px;
  aspect-ratio: 1;
`;

export const InstructionsContainer = styled.div`
  grid-area: gameinstructions; /* Set grid-area to match */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center horizontally */
  /* align-items: center; Center vertically */
`;
