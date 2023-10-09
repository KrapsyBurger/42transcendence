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
import {
  IUser,
  IFriend,
  IFriendRequest,
} from "../../../../interfaces/interfaces";

// Api utils
import {
  fetchAllUsers,
  fetchFriendRequests,
  fetchFriends,
  sendFriendRequest,
} from "../../../../api.utils";

// Context
import { AuthContext } from "../../../../AuthContext";

// Icons
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PublicProfile from "../../../../components/publicprofile/PublicProfileModal";

const AddFriend = () => {
  const [restOfTheWorldUsers, setRestOfTheWorldUsers] = useState<IUser[]>([]);
  const { userId } = useContext(AuthContext);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // Add state for selected user
  const [isProfileOpen, setProfileOpen] = useState(false); // Add state for profile open/close

  const handleOpenProfile = (userId: number | null) => {
    setSelectedUserId(userId);
    setProfileOpen(true);
  };

  const handleSendFriendRequest = async (userId: number, username: string) => {
    try {
      console.log(`Function called to send request to ${username}`);
      await sendFriendRequest(userId);
      console.log(`Friend request sent to ${username}`);
      toast.success(`Friend request sent to ${username}`, {
        className: "toast-message",
      });
      setRestOfTheWorldUsers((prevRestOfTheWorldUsers) =>
        prevRestOfTheWorldUsers.filter((user) => user.id !== userId)
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  // Function to filter non-friends
  const filterNonFriends = (
    users: IUser[],
    userId: number | null,
    friends: IFriend[],
    friendRequests: IFriendRequest[]
  ): IUser[] => {
    return users.filter((user) => {
      return (
        user.id !== userId &&
        !friends.some((friend) => friend.id === user.id) &&
        !friendRequests.some(
          (request) =>
            (request.senderId === userId && request.receiverId === user.id) ||
            (request.senderId === user.id && request.receiverId === userId)
        )
      );
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersData = await fetchAllUsers();

        // Fetch friends of user
        const friendsData = await fetchFriends();

        // Fetch friends requests of user (sender and receiver)
        const friendRequestsData = await fetchFriendRequests();

        // Filter non-friends
        const nonFriends = filterNonFriends(
          usersData,
          userId,
          friendsData,
          friendRequestsData
        );
        setRestOfTheWorldUsers(nonFriends);
        console.log("ROW: ", nonFriends);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <Box sx={{ width: 1 }}>
      <Typography>Rest of the world - {restOfTheWorldUsers.length}</Typography>
      <div style={{ maxHeight: 350, overflow: "auto" }}>
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
                <Tooltip title="Send friend request">
                  <ListItemButton
                    onClick={() =>
                      handleSendFriendRequest(user.id, user.username)
                    }
                  >
                    <PersonAddIcon />
                  </ListItemButton>
                </Tooltip>
              </Box>
            </ListItem>
          ))}
        </List>
      </div>
      <PublicProfile
        userId={selectedUserId}
        open={isProfileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </Box>
  );
};

export default AddFriend;
