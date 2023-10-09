// Packages
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Interfaces
import { IUser, IUserBlocks } from "../../../interfaces/interfaces";

// // Components
// import { PBTextField } from "../../Profile.styles";

// Styles
import { Avatar, Box, Button, Tooltip } from "@mui/material";

// Icons
import MessageIcon from "@mui/icons-material/Message";
import LockOpenIcon from "@mui/icons-material/LockOpen";

// Interfaces
import { ProfileProps } from "../../../interfaces/interfaces";
import BlockIcon from "@mui/icons-material/Block";

// Api utils
// import api from "../../../../api";
import {
  blockUser,
  fetchUserBlocks,
  fetchUserData,
  unblockUser,
} from "../../../api.utils";

const PublicProfileInfos = ({ userId }: ProfileProps) => {
  const [user, setUser] = useState<IUser | null>(null); // Currently logged in user
  const navigate = useNavigate();
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [userBlocks, setUserBlocks] = useState<IUserBlocks[] | null>(null);
  const [blockTriggered, setBlockTriggered] = useState(false);

  const handleSendMessage = async (userId: number | null) => {
    try {
      const convUser = await fetchUserData(userId);
      console.log("conv user", convUser);
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
  };

  const handleBlockUser = async (userId: number | null, username: string) => {
    try {
      console.log(`Function called to block user ${username}`);
      await blockUser(userId);
      setBlockTriggered(true);
      toast.success(`${username} blocked`);
    } catch (error) {
      console.error("Error blocking user", error);
    }
  };

  const handleUnblockUser = async (userId: number | null, username: string) => {
    try {
      console.log(`Function called to unblock user ${username}`);
      await unblockUser(userId);
      setBlockTriggered(true);
      toast.success(`${username} unblocked`);
    } catch (error) {
      console.error("Error blocking user", error);
    }
  };

  useEffect(() => {
    fetchUserData(userId)
      .then((userData: IUser) => {
        setUser(userData);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [userId]);

  useEffect(() => {
    fetchUserBlocks()
      .then((userBlocks: IUserBlocks[]) => {
        setUserBlocks(userBlocks);
        console.log("User blocks: ", userBlocks);
      })
      .catch((error) => {
        console.error("Error fetching user blocks:", error);
      });
    setBlockTriggered(false);
  }, [blockTriggered]);

  useEffect(() => {
    if (
      userId &&
      userBlocks &&
      userBlocks.some((userBlock) => userBlock.blockedId === userId)
    ) {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
    }
  }, [userBlocks, userId]);

  return (
    <>
      {user && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Avatar
              alt={user.username}
              src={user.avatar}
              sx={{ width: 130, height: 130 }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              padding: 2,
            }}
          >
            {/* Username */}
            <Box
              sx={{
                marginBottom: 2,
                color: "#009be5",
              }}
            >
              username
              <Box
                sx={{
                  border: 1,
                  borderColor: "#009be5",
                  borderRadius: 2,
                  padding: 1.2,
                  color: "white",
                }}
              >
                {user.username}
              </Box>
            </Box>

            {/* email */}
            <Box
              sx={{
                marginBottom: 0.5,
                color: "#009be5",
              }}
            >
              email
              <Box
                sx={{
                  border: 1,
                  borderColor: "#009be5",
                  borderRadius: 2,
                  padding: 1.2,
                  color: "white",
                }}
              >
                {user.email}
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              mt: -7.9,
              marginLeft: "12px",
            }}
          >
            <Box
              sx={{
                padding: 1,
              }}
            >
              <Tooltip title="Send message">
                <Button
                  onClick={() => handleSendMessage(userId)}
                  sx={{ color: "white" }}
                >
                  <MessageIcon />
                </Button>
              </Tooltip>
            </Box>
            <Box
              sx={{
                padding: 1,
              }}
            >
              {!isBlocked && (
                <Tooltip title="Block user">
                  <Button
                    onClick={() => handleBlockUser(userId, user.username)}
                    sx={{ color: "white" }}
                  >
                    <BlockIcon />
                  </Button>
                </Tooltip>
              )}
              {isBlocked && (
                <Tooltip title="Unblock user">
                  <Button
                    onClick={() => handleUnblockUser(userId, user.username)}
                    sx={{ color: "white" }}
                  >
                    <LockOpenIcon />
                  </Button>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default PublicProfileInfos;