// Packages
import { useEffect, useState } from "react";
import styled from "styled-components";

// Styles
import { Box, Tab, Typography } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab/";

// Components
import Pending from "./pending/Pending";
import InvitePlayer from "./inviteplayer/InvitePlayer";
import { Socket } from "socket.io-client";
import { IGameInvite } from "../../../../../interfaces/interfaces";
import { fetchGameInvites } from "../../../../../api.utils";

const CustomTabPanel = styled(TabPanel)`
  height: 400px;
  overflowy: "auto";
`;

interface GameInvitesTableProps {
  socket: Socket | null;
}

export const GameInvitesTable = ({ socket }: GameInvitesTableProps)  => {
  const [value, setValue] = useState("1");
  const [gameInvites, setGameInvites] = useState<IGameInvite[]>([]);


  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  useEffect(() => {
    const getInvites = async () => {
      fetchGameInvites()
        .then((gameInvitesData: IGameInvite[]) =>
          setGameInvites(gameInvitesData)
        )
        .catch((error) => {
          console.error("Error fetching game invites:", error);
        });
    };
  
    getInvites();
      
    // Socket listener, update game invites
    socket?.on("updateGameInvites", (gameInvite: IGameInvite) => {
      getInvites();
    });
  
    return () => {
      socket?.off("updateGameInvites");
    };
  }, [socket]);  

  return (
    <TabContext value={value}>
      <Box>
        {/* Table headers */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography>Game invites</Typography>
          <TabList value={value} onChange={handleChange}>
            <Tab label="&nbsp;&nbsp;Pending&nbsp;&nbsp;" value="1" />
            <Tab
              label="&nbsp;Invite to game&nbsp;"
              value="2"
              sx={{
                bgcolor: "#009be5",
                color: "white",
                boxShadow:
                  "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)",
                boxSizing: "border-box",
                padding: "6px 16px",
                borderRadius: "8px",
                '&.Mui-selected': {
                  // color: "white",
                  bgcolor: "transparent",
                },
                '&.MuiTabs-indicator': {
                  backgroundColor: "orange",
                  border: "none",
                  height: 3,
                  boxShadow: "0px"
                },
              }}
            />
          </TabList>
        </Box>
        {/* Table cells */}
        <CustomTabPanel value="1">
          <Pending gameInvites={gameInvites} setGameInvites={setGameInvites}/>
        </CustomTabPanel>
        <CustomTabPanel value="2"><InvitePlayer gameInvites={gameInvites} setGameInvites={setGameInvites}/></CustomTabPanel>
      </Box>
    </TabContext>
  );
};
