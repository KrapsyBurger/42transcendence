import { useState } from "react";

import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Divider } from "@mui/material";

import ChannelJoinModal from "./ChannelJoinModal";
import ChannelCreationModal from "./ChannelCreationModal";

// Interfaces
import { IChannel } from "../../../../interfaces/interfaces";

const page = {
  py: "2px",
  px: 3,
  color: "rgba(255, 255, 255, 0.7)",
  "&:hover, &:focus": {
    bgcolor: "rgba(255, 255, 255, 0.08)",
  },
};

type ManageChannelsProps = {
  channels: IChannel[]; // Define the type of the 'channels' prop
  socketRef: React.MutableRefObject<any>; // Define the type of the 'socketRef' prop
};

const ManageChannels = ({
  channels,
  socketRef,
}: ManageChannelsProps): JSX.Element => {
  const [showChannelJoinModel, setShowChannelJoinModel] = useState(false); // State for the channel creation modal visibility
  const [showChannelCreationModal, setShowChannelCreationModal] =
    useState(false); // State for the channel creation modal visibility

  return (
    <>
      <Box key="Manage Channels">
        <Divider sx={{ mt: 2 }} />
        <ListItem sx={{ py: 2, px: 3 }}>
          <ListItemText sx={{ color: "#fff" }}>Manage Channels</ListItemText>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            sx={page}
            onClick={() => setShowChannelJoinModel(true)}
          >
            <ListItemText>Join channel</ListItemText>
          </ListItemButton>
        </ListItem>
        <ChannelJoinModal
          isOpen={showChannelJoinModel}
          onClose={() => setShowChannelJoinModel(false)}
          socket={socketRef.current}
          currentChannels={channels}
        />
        <ListItem disablePadding>
          <ListItemButton
            sx={page}
            onClick={() => setShowChannelCreationModal(true)}
          >
            <ListItemText>Create channel</ListItemText>
          </ListItemButton>
        </ListItem>
        <ChannelCreationModal
          isOpen={showChannelCreationModal}
          onClose={() => setShowChannelCreationModal(false)}
          socket={socketRef.current}
        />
      </Box>
    </>
  );
};

export default ManageChannels;
