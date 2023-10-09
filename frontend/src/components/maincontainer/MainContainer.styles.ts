import styled from "styled-components";

export const MainContainer = styled.div`
  display: grid;
  min-height: 100vh;
  position: relative;
  background-color: #36393f;
  color: white;
  grid-template-columns: 200px 4fr;
  grid-template-areas: "leftsidebar main rightsidebar";
`;
