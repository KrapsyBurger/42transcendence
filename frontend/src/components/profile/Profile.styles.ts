import styled from "styled-components";
import { MainContainer } from "../maincontainer/MainContainer.styles";
import { TextField } from "@mui/material";

export const ProfilePageContainer = styled(MainContainer)`
  grid-template-columns: 200px 1fr 4fr 1fr;
  grid-template-rows: 1fr 1fr 1fr 3fr 1fr;
  grid-template-areas:
    "leftsidebar . . ."
    "leftsidebar . main ."
    "leftsidebar . main ."
    "leftsidebar . main ."
    "leftsidebar . . .";
  background-color: #36393f;
`;
export const ProfileContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  grid-area: main;
`;

export const StatsTotalContainer = styled.div`
  justify-content: space-betweem;
  display: flex;
  flex-direction: row;
`;
export const GameTableContainer = styled.div`
  margin-top: 20px;
`;

export const PBTextField = styled(TextField)`
  &&& {
    margin: 5px;
  }
  .MuiInputBase-input {
    color: white; /* Set the font color to white */
  }
`;
