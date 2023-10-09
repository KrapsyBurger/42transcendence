import React, { useContext, useEffect, useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { IGameInvite, IUser } from "../../../../interfaces/interfaces";
import { checkTokenExpiration } from "../../../../utils";
import { useNavigate } from "react-router";
import { AuthContext } from "../../../../AuthContext";
import { toast } from "react-toastify";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { fetchGameInvites, sendGameInvite } from "../../../../api.utils";
import PublicProfile from "../../../../components/publicprofile/PublicProfileModal";
import { localhost } from "../../../../api";

interface ContextMenuProps {
  user: IUser;
  children: (
    handleContextMenu: (event: React.MouseEvent) => void
  ) => React.ReactNode;
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    secondary: {
      main: "#f48fb1",
    },
    background: {
      paper: "#000000",
    },
  },
});

export function ContextMenu({ user, children }: ContextMenuProps) {
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const { token, userId, setToken, setUserId } = useContext(AuthContext);
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // to refresh the list of blocked users
  const [gameInvites, setGameInvites] = useState<IGameInvite[]>([]);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY + 4,
    });
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleBlock = () => {
    fetch(`http://${localhost}:3333/chat/block/user/${user.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        checkTokenExpiration(response, navigate, setToken, setUserId);
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.message);
          });
        }
        return response.json();
      })
      .then((data) => {
        toast.success("User blocked successfully", {
          className: "toast-message",
        });
        setRefreshKey((oldKey) => oldKey + 1);
        handleClose();
      })
      .catch((error) => {
        if (error.message !== "Unauthorized") {
          console.error("An error occurred while blocking a user:", error);
          toast.error(error.message, {
            className: "toast-message",
          });
        }
      });
  };

  const handleUnblock = () => {
    fetch(`http://${localhost}:3333/chat/block/user/${user.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        checkTokenExpiration(response, navigate, setToken, setUserId);
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.message);
          });
        }
        return response.json();
      })
      .then((data) => {
        toast.success("User unblocked successfully", {
          className: "toast-message",
        });
        setRefreshKey((oldKey) => oldKey + 1);
        handleClose();
      })
      .catch((error) => {
        if (error.message !== "Unauthorized") {
          console.error("An error occurred while unblocking a user:", error);
          toast.error(error.message, {
            className: "toast-message",
          });
        }
      });
  };

  const handleSendGameInvite = async (userId: number, username: string) => {
    try {
      console.log(`Function called to send invite to ${username}`);
      await sendGameInvite(userId);
      console.log(`Game invite sent to ${username}`);
      toast.success(`Game invite sent to ${username}`, {
        className: "toast-message",
      });
      setRefreshKey((oldKey) => oldKey + 1);
      handleClose();
    } catch (error: any) {
      console.error("Error sending game invite:", error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message, {
        className: "toast-message",
      });
    }
  };

  const handleProfileClick = () => {
    setProfileOpen(true);
    setSelectedUserId(user.id);
    handleClose();
  };

  useEffect(() => {
    // Get the list of blocked users
    fetch(`http://${localhost}:3333/chat/block/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        checkTokenExpiration(response, navigate, setToken, setUserId);
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.message);
          });
        }
        return response.json();
      })
      .then((data) => {
        setBlockedUsers(data);
      })
      .catch((error) => {
        if (error.message !== "Unauthorized") {
          console.error(
            "An error occurred while fetching the blocked users:",
            error
          );
          toast.error(error.messag, {
            className: "toast-message",
          });
        }
      });
  }, [token, navigate, setToken, setUserId, refreshKey]);

  useEffect(() => {
    fetchGameInvites()
      .then((gameInvitesData: IGameInvite[]) => 
        setGameInvites(gameInvitesData)
      )
      .catch((error) => {
        console.error("Error fetching game invites:", error);
      });
  }, [refreshKey]);

  return (
    <>
      {children(handleContextMenu)}
      <ThemeProvider theme={darkTheme}>
        <Menu
          keepMounted
          open={contextMenu !== null}
          onClose={handleClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={handleProfileClick}>Profile</MenuItem>

          {user.id !== userId &&
            (blockedUsers.some(
              (blockedUserId: number) => blockedUserId === user.id
            ) ? (
              <MenuItem onClick={handleUnblock}>Unblock User</MenuItem>
            ) : (
              <MenuItem onClick={handleBlock}>Block User</MenuItem>
            ))}

            {user.id !== userId &&
              !gameInvites.some(
                (gameInvite) =>
                  (gameInvite.inviterId === userId && gameInvite.inviteeId === user.id) ||
                  (gameInvite.inviteeId === userId && gameInvite.inviterId === user.id)
              ) && (
                <MenuItem onClick={() => handleSendGameInvite(user.id, user.username)}>Invite to Game</MenuItem>
            )}
        </Menu>
      </ThemeProvider>
      <PublicProfile
        userId={selectedUserId}
        open={isProfileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}
