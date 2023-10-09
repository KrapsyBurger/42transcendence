import styled from "styled-components";

export const Container = styled.div`
  display: grid;
  min-height: 100vh;
  position: relative;
  background-color: #2f3136;
  color: white;
  grid-template-columns: 200px 4fr 200px;
  grid-template-rows: 20px 4fr 20px;
  grid-template-areas:
    "nav main channeldetails"
    "chatnav main channeldetails "
    "logout . .";
`;
