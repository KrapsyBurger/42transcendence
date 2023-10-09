import React, { useContext, useEffect, useState } from "react";
import { ConnectionStatus, IChannel, Location } from "../../../../interfaces/interfaces";
import styles from "./ChannelSidebar.module.css";
import { Socket } from "socket.io-client";
import { AuthContext } from "../../../../AuthContext";
// Modals
import ChannelAddMemberModal from "../modals/ChannelAddMemberModal";
import ChannelAddAdminModal from "../modals/ChannelAddAdminModal";
import ChannelUpdateModal from "../modals/ChannelUpdateModal";
import ChannelDelMemberModal from "../modals/ChannelDelMemberModal";
import ChannelBanMemberModal from "../modals/ChannelBanMemberModal";
import ChannelUnbanMemberModal from "../modals/ChannelUnbanMemberModal";
import ChannelMuteMemberModal from "../modals/ChannelMuteMemberModal";
import ChannelDeletionModal from "../modals/ChannelDeletionModal";

import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import { ContextMenu } from "../contextmenu/ContextMenu";
import { Badge } from "@mui/material";
import { styled } from "@mui/system";
import { fetchChannelData } from "../../../../api.utils";
import ChannelLeaveModal from "../modals/ChannelLeaveModal";

interface IChannelSidebarProps {
  activeChannel: IChannel | null;
  socket: Socket | null;
}

const userListItem = {
  color: "rgba(255, 255, 255, 0.7)",
  "&:hover, &:focus": {
    bgcolor: "rgba(255, 255, 255, 0.08)",
  },
};

const userListItemText = {
  color: "#fff", pl: 1
};

const StyledBadge = styled(Badge)(({ theme, color }) => ({
  '& .MuiBadge-dot': {
    width: 12,
    height: 12,
    backgroundColor: color === 'success' ? theme.palette.success.main : 'grey',
    zIndex: 0,
  },
}));


function ChannelSidebar({ activeChannel, socket }: IChannelSidebarProps) {
  const [showChannelAddMemberModal, setShowChannelAddMemberModal] =
    useState(false);
  const [showChannelAddAdminModal, setShowChannelAddAdminModal] =
    useState(false);
  const [showChannelUpdateModal, setShowChannelUpdateModal] = useState(false);
  const [showChannelDelMemberModal, setShowChannelDelMemberModal] =
    useState(false);
  const [showChannelBanMemberModal, setShowChannelBanMemberModal] =
    useState(false);
  const [showChannelUnbanMemberModal, setShowChannelUnbanMemberModal] =
    useState(false);
  const [showChannelMuteMemberModal, setShowChannelMuteMemberModal] =
    useState(false);
  const [showChannelDeletionModal, setShowChannelDeletionModal] =
    useState(false);
  const [showChannelLeaveModal, setShowChannelLeaveModal] =
    useState(false);
  const [mutedUsers, setMutedUsers] = useState<
    Record<string, NodeJS.Timeout | undefined>
  >({});
  const [updatedChannel, setUpdatedChannel] = useState<IChannel | null>(activeChannel);
  const { userId } = useContext(AuthContext);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (activeChannel)
    {
      fetchChannelData(activeChannel.id)
      .then((updatedChannel: IChannel) => {
        setUpdatedChannel(updatedChannel);
      })
      .catch((error) => {
        console.error("Error fetching channel data:", error);
      });
    }
  }, [activeChannel]);

  useEffect(() => {
    updatedChannel?.mutes.forEach((mute) => {
      const muteExpiration = new Date(mute.muteExpiration);
      console.log(
        "muteExpiration",
        muteExpiration,
        "new Date()",
        new Date(),
        "compare",
        muteExpiration > new Date(),
      );
      if (muteExpiration > new Date()) {
        console.log("muteExpiration IN", muteExpiration);
        setMutedUsers((prevMutedUsers) => {
          if (prevMutedUsers[mute.userId]) {
            clearTimeout(prevMutedUsers[mute.userId]);
          }
          return {
            ...prevMutedUsers,
            [mute.userId]: setTimeout(() => {
              setMutedUsers((prevMutedUsers) => {
                const newMutedUsers = { ...prevMutedUsers };
                delete newMutedUsers[mute.userId];
                return newMutedUsers;
              });
            }, muteExpiration.getTime() - new Date().getTime()),
          };
        });
      }
    });
  }, [updatedChannel?.mutes]);

  return (
    <div className={styles["sidebar-container"]}>
      <Button
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={handleClick}
        sx={{
          bgcolor: "#7289da",
          color: "#fff",
          "&:hover": {
            bgcolor: "#7289da",
          },
          width: "100%",
        }}
      >
        Channel Menu
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          ".MuiPaper-root": {
            backgroundColor: "#7289da",
            color: "#fff",
            justifyContent: "center",
            fontSize: "0.875rem"
            // size: "";
          },
          ".MuiMenuItem-gutters": {
            justifyContent: "center",
            fontSize: "0.875rem",
            lineHeight: "1",
          }
        }}
      >
        {updatedChannel && updatedChannel.ownerId === userId && (
          <MenuItem
            onClick={() => {
              setShowChannelUpdateModal(true);
              handleClose();
            }}
          >
            Update Infos
          </MenuItem>
        )}
        <ChannelUpdateModal
          isOpen={showChannelUpdateModal}
          onClose={() => setShowChannelUpdateModal(false)}
          socket={socket}
          currentChannel={updatedChannel}
        />
        {updatedChannel && updatedChannel.ownerId === userId && (
          <MenuItem
            onClick={() => {
              setShowChannelAddAdminModal(true);
              handleClose();
            }}
          >
            Promote to Admin
          </MenuItem>
        )}
        <ChannelAddAdminModal
          isOpen={showChannelAddAdminModal}
          onClose={() => setShowChannelAddAdminModal(false)}
          socket={socket}
          currentChannel={updatedChannel}
        />
        {updatedChannel && updatedChannel.ownerId === userId && (
          <MenuItem
            onClick={() => {
              setShowChannelDeletionModal(true);
              handleClose();
            }}
          >
            Delete Channel
          </MenuItem>
        )}
        <ChannelDeletionModal
          isOpen={showChannelDeletionModal}
          onClose={() => setShowChannelDeletionModal(false)}
          socket={socket}
          currentChannel={updatedChannel}
        />
        {updatedChannel &&
          updatedChannel.admins &&
          updatedChannel.admins.some((admin) => admin.userId === userId) && (
            <MenuItem
              onClick={() => {
                setShowChannelDelMemberModal(true);
                handleClose();
              }}
            >
              Kick Member
            </MenuItem>
          )}
        <ChannelDelMemberModal
          isOpen={showChannelDelMemberModal}
          onClose={() => setShowChannelDelMemberModal(false)}
          socket={socket}
          currentChannel={updatedChannel}
        />
        {updatedChannel &&
          updatedChannel.admins &&
          updatedChannel.admins.some((admin) => admin.userId === userId) && (
            <MenuItem
              onClick={() => {
                setShowChannelBanMemberModal(true);
                handleClose();
              }}
            >
              Ban Member
            </MenuItem>
          )}
        <ChannelBanMemberModal
          isOpen={showChannelBanMemberModal}
          onClose={() => setShowChannelBanMemberModal(false)}
          socket={socket}
          currentChannel={updatedChannel}
        />
        {updatedChannel &&
          updatedChannel.admins &&
          updatedChannel.admins.some((admin) => admin.userId === userId) && (
            <MenuItem
              onClick={() => {
                setShowChannelUnbanMemberModal(true);
                handleClose();
              }}
            >
              Unban Member
            </MenuItem>
          )}
        <ChannelUnbanMemberModal
          isOpen={showChannelUnbanMemberModal}
          onClose={() => setShowChannelUnbanMemberModal(false)}
          socket={socket}
          currentChannel={updatedChannel}
        />
        {updatedChannel &&
          updatedChannel.admins &&
          updatedChannel.admins.some((admin) => admin.userId === userId) && (
            <MenuItem
              onClick={() => {
                setShowChannelMuteMemberModal(true);
                handleClose();
              }}
            >
              Mute Member
            </MenuItem>
          )}
        <ChannelMuteMemberModal
          isOpen={showChannelMuteMemberModal}
          onClose={() => setShowChannelMuteMemberModal(false)}
          socket={socket}
          currentChannel={updatedChannel}
          mutedUsers={mutedUsers}
        />
        <MenuItem
          onClick={() => {
            setShowChannelAddMemberModal(true);
            handleClose();
          }}
        >
          Add Member
        </MenuItem>
        <ChannelAddMemberModal
          isOpen={showChannelAddMemberModal}
          onClose={() => setShowChannelAddMemberModal(false)}
          socket={socket}
          currentChannel={updatedChannel}
        />
        <ChannelLeaveModal
          isOpen={showChannelLeaveModal}
          onClose={() => setShowChannelLeaveModal(false)}
          socket={socket}
          currentChannel={activeChannel}
        />
        {activeChannel &&
          activeChannel.ownerId !== userId && (
            <MenuItem
              onClick={() => {
                setShowChannelLeaveModal(true);
                handleClose();
              }}
            >
              Leave Channel
            </MenuItem>
          )}
      </Menu>

      <p className={styles["sidebar-title"]}>Owner</p>
      {updatedChannel && updatedChannel.members && (
        <ContextMenu
        key={updatedChannel.owner.id}
        user={updatedChannel.owner}
        >
        {(handleContextMenu) => (
          <ListItem onContextMenu={handleContextMenu} disablePadding sx={userListItem}>
            {updatedChannel.owner.connectionStatus !== null && updatedChannel.owner.connectionStatus !== undefined ? (
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                color={updatedChannel.owner.connectionStatus === ConnectionStatus.ONLINE ? "success" : "default"}
              >
                <Avatar src={updatedChannel.owner.avatar} alt={updatedChannel.owner.username} />
              </StyledBadge>
            ) : (
              <Avatar src={updatedChannel.owner.avatar} alt={updatedChannel.owner.username} />
            )}
            <ListItemText
              primary={updatedChannel.owner.username}
              secondary={updatedChannel.owner.currentLocation !== null && updatedChannel.owner.currentLocation !== undefined? Location[updatedChannel.owner.currentLocation] : null}
              sx={{
                ...userListItemText,
                height: "33px",
                '.MuiListItemText-secondary': { color: 'grey', fontSize: '0.7rem' } // secondary text appearance
              }}
            />
          </ListItem>
        )}
      </ContextMenu>
      )}
      {updatedChannel &&
        updatedChannel.admins &&
        updatedChannel.admins.length > 1 && (
          <>
            <p className={styles["sidebar-title"]}>Admins</p>
            {updatedChannel.admins &&
              updatedChannel.admins
                .filter((admin) => admin.userId !== updatedChannel.ownerId) // exclude the owner
                .map((admin) => (
                  <ContextMenu
                  key={admin.userId}
                  user={admin.user}
                  >
                  {(handleContextMenu) => (
                    <ListItem onContextMenu={handleContextMenu} disablePadding sx={userListItem}>
                      {admin.user.connectionStatus !== null && admin.user.connectionStatus !== undefined ? (
                        <StyledBadge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          color={admin.user.connectionStatus === ConnectionStatus.ONLINE ? "success" : "default"}
                        >
                          <Avatar src={admin.user.avatar} alt={admin.user.username} />
                        </StyledBadge>
                      ) : (
                        <Avatar src={admin.user.avatar} alt={admin.user.username} />
                      )}
                      <ListItemText
                        primary={admin.user.username}
                        secondary={admin.user.currentLocation !== null && admin.user.currentLocation !== undefined  ? Location[admin.user.currentLocation] : null}
                        sx={{
                          ...userListItemText,
                          '.MuiListItemText-secondary': { color: 'grey', fontSize: '0.7rem' } // secondary text appearance
                        }}
                      />
                      {mutedUsers[admin.userId] && <VolumeOffIcon />}
                    </ListItem>
                  )}
                </ContextMenu>
                ))}
          </>
        )}
      {updatedChannel &&
        updatedChannel.members &&
        updatedChannel.members.length > 1 &&
        updatedChannel.members.length > updatedChannel.admins.length && (
          <>
            <p className={styles["sidebar-title"]}>Members</p>
            {updatedChannel.members
              .filter(
                (user) =>
                  user.id !== updatedChannel.ownerId &&
                  !updatedChannel.admins.some(
                    (admin) => admin.userId === user.id,
                  ),
              ) // exclude the owner and admins
              .map((user) => (
                <ContextMenu
                key={user.id}
                user={user}
                >
                {(handleContextMenu) => (
                  <ListItem onContextMenu={handleContextMenu} disablePadding sx={userListItem}>
                    {user.connectionStatus !== null && user.connectionStatus !== undefined ? (
                      <StyledBadge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={user.connectionStatus === ConnectionStatus.ONLINE ? "success" : "default"}
                      >
                        <Avatar src={user.avatar} alt={user.username} />
                      </StyledBadge>
                    ) : (
                      <Avatar src={user.avatar} alt={user.username} />
                    )}
                    <ListItemText
                      primary={user.username}
                      secondary={user.currentLocation !== null && user.currentLocation !== undefined ? Location[user.currentLocation] : null}
                      sx={{
                        ...userListItemText,
                        height: "33px",
                        // marginTop: "4px",
                        // marginBottom: "4px",
                        '.MuiListItemText-secondary': { color: 'grey', fontSize: '0.7rem' } // secondary text appearance
                      }}
                    />
                    {mutedUsers[user.id] && <VolumeOffIcon />}
                  </ListItem>
                )}
              </ContextMenu>
              ))}
          </>
        )}
    </div>
  );
}

export default ChannelSidebar;
