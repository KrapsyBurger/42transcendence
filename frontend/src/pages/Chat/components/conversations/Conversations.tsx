// Interfaces
import { IChannel, IUser } from "../../../../interfaces/interfaces";

// Utils
import { isChannel } from "../../../../utils";

// Style
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { Divider, ListItemButton } from "@mui/material";
import { ContextMenu } from "../contextmenu/ContextMenu";

const page = {
  py: "2px",
  px: 3,
  color: "rgba(255, 255, 255, 0.7)",
  "&:hover, &:focus": {
    bgcolor: "rgba(255, 255, 255, 0.08)",
  },
};

const conv_box = {
  maxHeight: "200px",
  overflowY: "scroll",
  overflowX: "hidden",
  // Reveal scrollbar
  // Standard CSS
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(155, 155, 155, 0.2) transparent",
  // Webkit
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(155, 155, 155, 0.2)",
    borderRadius: "4px",
  },
};

interface IConversationsProps {
  activeConversation: IUser | IChannel | null;
  setActiveConversation: (conv: IUser | IChannel) => void;
  users: IUser[];
  channels: IChannel[];
}

function Conversations({
  activeConversation,
  setActiveConversation,
  users,
  channels,
}: IConversationsProps) {
  return (
    <>
        <Collapse in={channels.length > 0}>
          <Divider sx={{ mt: 2 }} />
          <ListItem sx={{ py: 1, px: 3 }}>
            <ListItemText sx={{ color: "#fff" }}>Channels</ListItemText>
          </ListItem>
          <Box sx={conv_box}>
            {channels.map((channel) => (
              <ListItem key={channel.id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    channel.unreadCount = 0; // Reset unread count when user is selected
                    setActiveConversation(channel);
                  }}
                  selected={
                    activeConversation?.id === channel.id &&
                    isChannel(activeConversation)
                  }
                  sx={page}
                >
                  <ListItemText>
                    {channel.name}{" "}
                    {channel.unreadCount ? `(${channel.unreadCount} unread)` : ""}
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            ))}
          </Box>
        </Collapse>
        <Divider sx={{ mt: 2 }} />
        <Collapse in={users.length > 0}>
          <ListItem sx={{ py: 1, px: 3 }}>
            <ListItemText sx={{ color: "#fff" }}>Direct messages</ListItemText>
          </ListItem>
          <Box sx={conv_box}>
            {users.map((user) => (
              <ContextMenu user={user} key={user.id}>
              {(handleContextMenu) => (
                <ListItem disablePadding onContextMenu={handleContextMenu}>
                  <ListItemButton
                    onClick={() => {
                      user.unreadCount = 0; // Reset unread count when user is selected
                      setActiveConversation(user);
                    }}
                    selected={
                      activeConversation?.id === user.id &&
                      !isChannel(activeConversation)
                    }
                    sx={page}
                  >
                    <ListItemText>
                      {user.username}{" "}
                      {user.unreadCount ? `(${user.unreadCount} unread)` : ""}
                    </ListItemText>
                  </ListItemButton>
                </ListItem>
              )}
              </ContextMenu>
            ))}
          </Box>
        </Collapse>
    </>
  );
}

export default Conversations;
