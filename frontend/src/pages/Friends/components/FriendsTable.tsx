// Packages
import { useState } from "react";
import styled from "styled-components";

// Styles
import { Box, Tab, Typography } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab/";

// Components
// import Online from "./online/Online";
import All from "./all/All";
import Blocked from "./blocked/Blocked";
import Pending from "./pending/Pending";
import AddFriend from "./addfriend/AddFriend";
import { IFriend, IFriendRequest } from "../../../interfaces/interfaces";

const CustomTabPanel = styled(TabPanel)`
  height: 400px;
  overflowy: "auto";
`;

interface IFriendsTableProps {
  friends: IFriend[];
  setFriends: React.Dispatch<React.SetStateAction<IFriend[]>>;
  friendRequests: IFriendRequest[];
  setFriendRequests: React.Dispatch<React.SetStateAction<IFriendRequest[]>>;
}

export const FriendsTable = ({
  friends,
  setFriends,
  friendRequests,
  setFriendRequests,
}: IFriendsTableProps) => {
  const [value, setValue] = useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

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
            <Typography>Friends</Typography>
            <TabList value={value} onChange={handleChange}>
              <Tab label="&nbsp;&nbsp;All&nbsp;&nbsp;" value="1" />
              <Tab label="Pending" value="2" />
              <Tab label="Blocked" value="3" />
              <Tab
                label="&nbsp;Add friend&nbsp;"
                value="4"
                sx={{
                  bgcolor: "#009be5",
                  color: "white",
                  boxShadow:
                    "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)",
                  boxSizing: "border-box",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  "&.Mui-selected": {
                    // color: "white",
                    bgcolor: "transparent",
                  },
                  "&.MuiTabs-indicator": {
                    backgroundColor: "orange",
                    border: "none",
                    height: 3,
                    boxShadow: "0px",
                  },
                }}
              />
            </TabList>
          </Box>
          {/* Table cells */}
          <CustomTabPanel value="1">
            <All friends={friends} setFriends={setFriends} />
          </CustomTabPanel>
          <CustomTabPanel value="2">
            <Pending
              friendRequests={friendRequests}
              setFriendRequests={setFriendRequests}
            />
          </CustomTabPanel>
          <CustomTabPanel value="3">
            <Blocked />
          </CustomTabPanel>
          <CustomTabPanel value="4">
            <AddFriend />
          </CustomTabPanel>
        </Box>
      </TabContext>
  );
};
