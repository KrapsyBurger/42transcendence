// Packages
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Components
import PublicProfile from "../../../../components/publicprofile/PublicProfileModal";

// Styles
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemButton,
  Tooltip,
  Badge
} from "@mui/material";

import { styled } from "@mui/system";

// Icons
import MessageIcon from "@mui/icons-material/Message";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";

// Interfaces
import { ConnectionStatus, IFriend } from "../../../../interfaces/interfaces";

// Api utils
import {
  fetchFriends,
  deleteFriend,
  fetchUserData,
} from "../../../../api.utils";


const StyledBadge = styled(Badge)(({ theme, color }) => ({
  '& .MuiBadge-dot': {
    width: 12,
    height: 12,
    backgroundColor: color === 'success' ? theme.palette.success.main : 'grey',
    zIndex: 0,
  },
}));

interface IAllProps {
  friends: IFriend[];
  setFriends: React.Dispatch<React.SetStateAction<IFriend[]>>;
}

const All = (
  { friends, setFriends }: IAllProps
) => {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // Add state for selected user
  const [isProfileOpen, setProfileOpen] = useState(false); // Add state for profile open/close

  const handleOpenProfile = (userId: number | null) => {
    console.log("Profile Modal is being opened")
    setSelectedUserId(userId);
    setProfileOpen(true);
  };

  const handleSendMessage = useCallback(
    async (userId: number) => {
      try {
        const convUser = await fetchUserData(userId);
        console.log(convUser.username);
        // Use useNavigate to navigate to the chat page with the activeConversation set to the target user
        navigate(
          "/chat",
          {
            state: { passedActiveConversation: convUser },
          } // Pass the user data as state
        );
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    },
    [navigate]
  );

  const handleRemoveFriend = useCallback(
    async (friendId: number, friendUsername: string) => {
      try {
        await deleteFriend(friendId);
        toast.success(`Friendship removed`, {
          className: "toast-message",
        });
        setFriends(
          (prevFriends) =>
            prevFriends?.filter((friend) => friend.id !== friendId) || null
        );
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
    },
    [setFriends]
  );

  useEffect(() => {
    fetchFriends()
      .then((friendsData: IFriend[]) => {
        setFriends(friendsData);
        console.log("Friends: ", friendsData);
      })
      .catch((error) => {
        console.error("Error fetching friends data:", error);
      });
  }, [handleSendMessage, handleRemoveFriend, setFriends]);

  return (
    <Box sx={{ width: 1 }}>
      {friends === null ? (
        <Typography>All - 0</Typography>
      ) : (
        <Typography>All - {friends.length}</Typography>
      )}
      {friends !== null && (
        <div style={{ maxHeight: 350, overflow: "auto" }}>
          <List>
            {friends.map((friend) => (
              <ListItem key={friend.id}>
                <ListItemButton
                  disableRipple
                  onClick={(e) => handleOpenProfile(friend.id)}
                >
                  <ListItemAvatar>
                    <StyledBadge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={friend.connectionStatus === ConnectionStatus.ONLINE ? "success" : "default"}
                      >
                        <Avatar alt={friend.username} src={friend.avatar} />
                      </StyledBadge>
                  </ListItemAvatar>
                  <ListItemText primary={friend.username} />
                  {/* <StatusText primary={friend.status} /> */}
                </ListItemButton>
                <Box sx={{ display: "flex" }}>
                  <Tooltip title="Send message">
                    <ListItemButton
                      onClick={() => handleSendMessage(friend.id)}
                    >
                      <MessageIcon />
                    </ListItemButton>
                  </Tooltip>
                  <Tooltip title="Remove friend">
                    <ListItemButton
                      onClick={() =>
                        handleRemoveFriend(friend.id, friend.username)
                      }
                    >
                      <PersonRemoveIcon />
                    </ListItemButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
          <PublicProfile
            userId={selectedUserId}
            open={isProfileOpen}
            onClose={() => setProfileOpen(false)}
          />
        </div>
      )}
    </Box>
  );
};

export default All;
