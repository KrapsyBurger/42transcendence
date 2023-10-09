// Packages
import { useEffect, useState, useCallback } from "react";
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

// Icons
import LockOpenIcon from "@mui/icons-material/LockOpen";

// Interfaces
import { IUserBlocks } from "../../../../interfaces/interfaces";

// Api utils
import { fetchUserBlocks, unblockUser } from "../../../../api.utils";
import PublicProfile from "../../../../components/publicprofile/PublicProfileModal";

const Blocked = () => {
  const [userBlocks, setUserBlocks] = useState<IUserBlocks[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // Add state for selected user
  const [isProfileOpen, setProfileOpen] = useState(false); // Add state for profile open/close

  const handleUnblockUser = useCallback(
    async (userId: number, username: string) => {
      try {
        await unblockUser(userId);
        setUserBlocks((prevUserBlocks) =>
          prevUserBlocks.filter((userBlock) => userBlock.blockedId !== userId)
        );
        toast.success(`${username} unblocked`, {
          className: "toast-message",
        });
      } catch (error) {
        console.error("Error unblocking user:", error);
      }
    },
    []
  );
  const handleOpenProfile = (userId: number | null) => {
    setSelectedUserId(userId);
    setProfileOpen(true);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userBlocksData = await fetchUserBlocks();
        setUserBlocks(userBlocksData);
        console.log("User blocks: ", userBlocksData);
      } catch (error) {
        console.error("Error fetching blocked users data:", error);
      }
    };

    fetchData();
  }, [handleUnblockUser, isProfileOpen]);

  return (
    <Box sx={{ width: 1 }}>
      <Typography>Blocked - {userBlocks.length}</Typography>
      <List>
        {userBlocks.map((userblock) => (
          <div style={{ maxHeight: 350, overflow: "auto" }}>
          <ListItem key={userblock.blockerId + userblock.blockedId}>
            <ListItemButton disableRipple onClick={(e) => handleOpenProfile(userblock.blocked.id)}>
              <ListItemAvatar>
                <Avatar
                  alt={userblock.blocked.username}
                  src={userblock.blocked.avatar}
                />
              </ListItemAvatar>
              <ListItemText primary={userblock.blocked.username} />
            </ListItemButton>
            <Box>
              <Tooltip title="Unblock">
                <ListItemButton
                  onClick={() =>
                    handleUnblockUser(
                      userblock.blocked.id,
                      userblock.blocked.username
                    )
                  }
                >
                  <LockOpenIcon />
                </ListItemButton>
              </Tooltip>
            </Box>
          </ListItem></div>
        ))}
      </List>
      <PublicProfile
        userId={selectedUserId}
        open={isProfileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </Box>
  );
};

export default Blocked;
