// Packages
import { useContext, useState } from "react";
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
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";

// Interfaces
import { IGameInvite } from "../../../../../../interfaces/interfaces";

// Api utils
import {
  acceptGameInvite,
  refuseGameInvite,
} from "../../../../../../api.utils";

// Context
import { AuthContext } from "../../../../../../AuthContext";
import PublicProfile from "../../../../../../components/publicprofile/PublicProfileModal";

interface PendingProps {
  gameInvites: IGameInvite[];
  setGameInvites: React.Dispatch<React.SetStateAction<IGameInvite[]>>;
}

const Pending = ({ gameInvites, setGameInvites }: PendingProps) => {
  const { userId } = useContext(AuthContext);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // Add state for selected user
  const [isProfileOpen, setProfileOpen] = useState(false); // Add state for profile open/close

  const handleAcceptGameInvite = async (
    gameInviteId: number,
    username: string
  ) => {
    try {
      console.log("gameInviteId", gameInviteId);
      await acceptGameInvite(gameInviteId);
      toast.success(`You accepted to play with ${username}`, {
        className: "toast-message",
      });
      setGameInvites((gameInvites) =>
        gameInvites.filter(
          (gameInvite) =>
            gameInvite.inviteeId !== gameInviteId &&
            gameInvite.inviterId !== gameInviteId
        )
      );
    } catch (error: any) {
      console.error(
        "Error accepting game invite:",
        error.response?.data?.message || error.message
      );
      toast.error(error.response?.data?.message, {
        className: "toast-message",
      });
    }
  };

  const handleRefuseGameInvite = async (
    gameInviteId: number,
    username: string
  ) => {
    try {
      await refuseGameInvite(gameInviteId);
      toast.success("GameInvite refused", {
        className: "toast-message",
      });
      setGameInvites((gameInvites) =>
        gameInvites.filter(
          (gameInvite) =>
            gameInvite.inviteeId !== userId && gameInvite.inviterId !== userId
        )
      );
    } catch (error: any) {
      console.error(
        "Error refusing game invite:",
        error.response?.data?.message || error.message
      );
      toast.error(error.response?.data?.message, {
        className: "toast-message",
      });
    }
  };

  const handleOpenProfile = (userId: number | null) => {
    setSelectedUserId(userId);
    setProfileOpen(true);
  };

  return (
    <Box sx={{ width: 1 }}>
      {gameInvites === null ? (
        <Typography>Pending - 0</Typography>
      ) : (
        <Typography>Pending - {gameInvites.length}</Typography>
      )}
      {gameInvites !== null && (
        <>
          <List>
            {gameInvites.map(
              (gameInvite: IGameInvite) =>
                gameInvite.inviterId === userId && (
                  <ListItem key={gameInvite.invitee.id}>
                        <ListItemButton
                          disableRipple
                          onClick={(e) =>
                            handleOpenProfile(gameInvite.invitee.id)
                          }
                        >
                      <ListItemAvatar>
                        <Avatar
                          alt={gameInvite.invitee.username}
                          src={gameInvite.invitee.avatar}
                        />
                      </ListItemAvatar>
                      <ListItemText primary={gameInvite.invitee.username} />
                    </ListItemButton>
                  </ListItem>
                )
            )}
            {gameInvites !== null && (
              <List>
                {gameInvites.map(
                  (gameInvite: IGameInvite) =>
                    gameInvite.invitee.id === userId && (
                      <ListItem key={gameInvite.inviter.id}>
                        <ListItemButton
                          disableRipple
                          onClick={(e) =>
                            handleOpenProfile(gameInvite.inviter.id)
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              alt={gameInvite.inviter.username}
                              src={gameInvite.inviter.avatar}
                            />
                          </ListItemAvatar>
                          <ListItemText primary={gameInvite.inviter.username} />
                        </ListItemButton>
                        <Box sx={{ display: "flex" }}>
                          <Tooltip title="Accept">
                            <ListItemButton
                              onClick={() =>
                                handleAcceptGameInvite(
                                  gameInvite.id,
                                  gameInvite.inviter.username
                                )
                              }
                            >
                              <CheckIcon />
                            </ListItemButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <ListItemButton
                              onClick={() =>
                                handleRefuseGameInvite(
                                  gameInvite.id,
                                  gameInvite.inviter.username
                                )
                              }
                            >
                              <ClearIcon />
                            </ListItemButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    )
                )}
              </List>
            )}
          </List>
          <PublicProfile
            userId={selectedUserId}
            open={isProfileOpen}
            onClose={() => setProfileOpen(false)}
          />
        </>
      )}
    </Box>
  );
};

export default Pending;
