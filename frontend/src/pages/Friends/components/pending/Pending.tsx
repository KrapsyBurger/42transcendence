// Packages
import { useEffect, useContext, useState, useCallback } from "react";
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
} from "@mui/material";

// Icons
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";

// Interfaces
import { IFriendRequest } from "../../../../interfaces/interfaces";

// Api utils
import {
  fetchFriendRequests,
  acceptFriendRequest,
  deleteFriendRequest,
} from "../../../../api.utils";

// Context
import { AuthContext } from "../../../../AuthContext";

interface IPendingProps {
  friendRequests: IFriendRequest[];
  setFriendRequests: React.Dispatch<React.SetStateAction<IFriendRequest[]>>;
}

const Pending = ({ friendRequests, setFriendRequests }: IPendingProps) => {
  const { userId } = useContext(AuthContext);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // Add state for selected user
  const [isProfileOpen, setProfileOpen] = useState(false); // Add state for profile open/close

  const handleAcceptRequest = useCallback(
    async (friendRequestId: number, username: string) => {
      try {
        await acceptFriendRequest(friendRequestId);
        toast.success(`You are now friend with ${username}`, {
          className: "toast-message",
        });
        setFriendRequests(
          (
            friendRequests //TODO: manual update is no longer needed since we fetch the data on updateFriendRequests event !!!
          ) =>
            friendRequests.filter(
              (friendRequest) => friendRequest.id !== friendRequestId
            )
        );
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
    },
    [setFriendRequests]
  );

  const handleDeleteRequest = useCallback(
    async (friendRequestId: number, username: string) => {
      try {
        await deleteFriendRequest(friendRequestId);
        toast.success("Friend request removed", {
          className: "toast-message",
        });
        setFriendRequests((friendRequests) =>
          friendRequests.filter(
            (friendRequest) => friendRequest.id !== friendRequestId
          )
        );
      } catch (error) {
        console.error("Error deleting friend request:", error);
      }
    },
    [setFriendRequests]
  );

  const handleOpenProfile = (userId: number | null) => {
    setSelectedUserId(userId);
    setProfileOpen(true);
  };

  useEffect(() => {
    fetchFriendRequests()
      .then((friendRequestsData: IFriendRequest[]) => {
        setFriendRequests(friendRequestsData);
        console.log("Friend Requests: ", friendRequestsData);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [handleAcceptRequest, handleDeleteRequest, setFriendRequests]);

  return (
    <Box sx={{ width: 1 }}>
      {friendRequests === null ? (
        <Typography>Pending - 0</Typography>
      ) : (
        <Typography>Pending - {friendRequests.length}</Typography>
      )}
      {friendRequests !== null && (
        <>
          <List>
            <div style={{ maxHeight: 350, overflow: "auto" }}>
              {friendRequests.map(
                (friendRequest: IFriendRequest) =>
                  friendRequest.sender.id === userId && (
                    <ListItem key={friendRequest.receiver.id}>
                      <ListItemButton
                        disableRipple
                        onClick={(e) =>
                          handleOpenProfile(friendRequest.receiver.id)
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            alt={friendRequest.receiver.username}
                            src={friendRequest.receiver.avatar}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={friendRequest.receiver.username}
                        />
                      </ListItemButton>
                      <Box>
                        <Tooltip title="Delete">
                          <ListItemButton
                            onClick={() =>
                              handleDeleteRequest(
                                friendRequest.id,
                                friendRequest.sender.username
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
              {friendRequests !== null && (
                <List>
                  {friendRequests.map(
                    (friendRequest: IFriendRequest) =>
                      friendRequest.receiver.id === userId && (
                        <ListItem key={friendRequest.sender.id}>
                          <ListItemButton
                            disableRipple
                            onClick={(e) =>
                              handleOpenProfile(friendRequest.sender.id)
                            }
                          >
                            <ListItemAvatar>
                              <Avatar
                                alt={friendRequest.sender.username}
                                src={friendRequest.sender.avatar}
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={friendRequest.sender.username}
                            />
                          </ListItemButton>
                          <Box sx={{ display: "flex" }}>
                            <Tooltip title="Accept">
                              <ListItemButton
                                onClick={() =>
                                  handleAcceptRequest(
                                    friendRequest.id,
                                    friendRequest.sender.username
                                  )
                                }
                              >
                                <CheckIcon />
                              </ListItemButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <ListItemButton
                                onClick={() =>
                                  handleDeleteRequest(
                                    friendRequest.id,
                                    friendRequest.sender.username
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
            </div>
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
