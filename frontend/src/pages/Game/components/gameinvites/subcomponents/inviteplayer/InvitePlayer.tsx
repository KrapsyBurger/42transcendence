// Packages
import { useEffect, useContext, useState } from "react";
import { toast } from "react-toastify";

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
} from "@mui/material";

// Interfaces
import { IUser, IGameInvite } from "../../../../../../interfaces/interfaces";

// Api utils
import { fetchAllUsers, sendGameInvite } from "../../../../../../api.utils";

// Context
import { AuthContext } from "../../../../../../AuthContext";

// Icons
import AddIcon from "@mui/icons-material/Add";
import PublicProfile from "../../../../../../components/publicprofile/PublicProfileModal";

interface InvitePlayerProps {
  gameInvites: IGameInvite[];
  setGameInvites: React.Dispatch<React.SetStateAction<IGameInvite[]>>;
}

const InvitePlayer = ({ gameInvites, setGameInvites }: InvitePlayerProps) => {
  const [restOfTheWorldUsers, setRestOfTheWorldUsers] = useState<IUser[]>([]);
  // const [gameInvites, setGameInvites] = useState<IGameInvite[]>([]);
  // const [users, setUsers] = useState<IUser[]>([]);
  const { userId } = useContext(AuthContext);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // Add state for selected user
  const [isProfileOpen, setProfileOpen] = useState(false); // Add state for profile open/close

  const handleSendGameInvite = async (userId: number, username: string) => {
    try {
      console.log(`Function called to send invite to ${username}`);
      await sendGameInvite(userId);
      console.log(`Game invite sent to ${username}`);
      toast.success(`Game invite sent to ${username}`, {
        className: "toast-message",
      });
      setRestOfTheWorldUsers((prevRestOfTheWorldUsers) =>
        prevRestOfTheWorldUsers.filter((user) => user.id !== userId)
      );
    } catch (error: any) {
      console.error(
        "Error sending game invite:",
        error.response?.data?.message || error.message
      );
      toast.error(error.response?.data?.message, {
        className: "toast-message",
      });
    }
  };

  // Function to filter users not already invited to game, or there is already a game invite from them
  const filterNonInvitedUsers = (
    users: IUser[],
    userId: number | null,
    gameInvites: IGameInvite[]
  ): IUser[] => {
    return users.filter((user) => {
      return (
        user.id !== userId &&
        !gameInvites.some(
          (gameInvite) =>
            gameInvite.inviteeId === user.id || gameInvite.inviterId === user.id
        )
      );
    });
  };

  const handleOpenProfile = (userId: number | null) => {
    setSelectedUserId(userId);
    setProfileOpen(true);
  };

  useEffect(() => {
    const fetchDataAndUpdate = async () => {
      try {
        // Fetch all users
        const usersData = await fetchAllUsers();

        // Filter non invited to game
        const nonInvited = filterNonInvitedUsers(
          usersData,
          userId,
          gameInvites
        );

        setRestOfTheWorldUsers(nonInvited);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchDataAndUpdate();
  }, [userId, gameInvites]); // Run the effect when userId changes

  return (
    <Box sx={{ width: 1 }}>
      <Typography>Rest of the world - {restOfTheWorldUsers.length}</Typography>
      <List>
        {restOfTheWorldUsers.map((user) => (
          <ListItem key={user.id}>
            <ListItemButton
              disableRipple
              onClick={(e) => handleOpenProfile(user.id)}
            >
              <ListItemAvatar>
                <Avatar alt={user.username} src={user.avatar} />
              </ListItemAvatar>
              <ListItemText primary={user.username} />
            </ListItemButton>
            <Box>
              <Tooltip title="Send game invite">
                <ListItemButton
                  onClick={() => handleSendGameInvite(user.id, user.username)}
                >
                  <AddIcon />
                </ListItemButton>
              </Tooltip>
            </Box>
            <PublicProfile
              userId={selectedUserId}
              open={isProfileOpen}
              onClose={() => setProfileOpen(false)}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default InvitePlayer;
