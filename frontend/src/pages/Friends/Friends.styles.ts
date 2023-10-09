import styled from "styled-components";
import { MainContainer } from "../../components/maincontainer/MainContainer.styles";

export const FriendsPageContainer = styled(MainContainer)`
  grid-template-columns: 200px 1fr;
  grid-template-rows: 1fr 4fr 1fr;
  grid-template-areas:
    "leftsidebar ."
    "leftsidebar main"
    "leftsidebar .";
`;

export const FriendsTableContainer = styled.div`
  grid-area: main;
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
`;
