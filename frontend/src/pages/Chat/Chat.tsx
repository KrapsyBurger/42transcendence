// Packages
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

// Interfaces
import {
  ConnectionStatus,
  IChannel,
  IMessage,
  IUser,
} from "../../interfaces/interfaces";

// Context
import { AuthContext } from "../../AuthContext";

// Components
import MainContainer from "../../components/maincontainer/MainContainer";
import NavBox from "../../components/sidebar/navbox/NavBox";
import ManageChannels from "./components/managechannels/ManageChannels";
import Conversations from "./components/conversations/Conversations";
import Logout from "../../components/sidebar/logout/Logout";
import LogoutContainer from "../../components/sidebar/logout/Logout.styles";
import ChannelSidebar from "./components/channelsidebar/ChannelSidebar";
import { LeftSideBarContainer } from "../../components/sidebar/SideBar.styles";

// Styles
import styles from "./Chat.module.css";

// Utils
import { checkTokenExpiration, isChannel } from "../../utils";
import { Button } from "@mui/material";
import PublicProfile from "../../components/publicprofile/PublicProfileModal";
import { toast } from "react-toastify";
import { localhost } from "../../api";

function Chat() {
  //////////////////////////////////////// STATES & REFS ////////////////////////////////////////
  const location = useLocation();
  const passedActiveConversation = location.state
    ? location.state.passedActiveConversation
    : null;
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<
    IUser | IChannel | null
  >(passedActiveConversation); // User currently selected in the sidebar
  const activeConversationRef = useRef(activeConversation); // Reference to the active conversation state, used to avoid re-rendering when the active conversation changes
  const [user, setUser] = useState<IUser | null>(null); // Currently logged in user
  const { token, userId, setToken, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState<IUser[]>([]);
  const [channels, setChannels] = useState<IChannel[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Reference to the element where the scroll shoud go when a new message is received
  const firstScroll = useRef(false);
  const [myAvatarURL, setMyAvatarURL] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null); // Add state for selected user
  const [isProfileOpen, setProfileOpen] = useState(false); // Add state for profile open/close

  //////////////////////////////////////// API CALLS ////////////////////////////////////////

  const fetchChannels = useCallback(() => {
    console.log("Fetching channels...");
    fetch(`http://${localhost}:3333/chat/channels/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        checkTokenExpiration(response, navigate, setToken, setUserId);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Channels is fetched at this point in time
        setChannels(data);
      })
      .catch((error) => {
        if (error.message !== "Unauthorized")
          console.error(
            "An error occurred while fetching the channels:",
            error
          );
      });
  }, [token, navigate, setToken, setUserId]);

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(
    (messages: IMessage[]) => {
      messages.forEach((message: IMessage) => {
        if (!message.isRead) {
          fetch(`http://${localhost}:3333/chat/read/${message.id}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((response) => {
              checkTokenExpiration(response, navigate, setToken, setUserId);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
            })
            .catch((error) => {
              if (error.message !== "Unauthorized")
                console.error(
                  "An error occurred while updating the message:",
                  error
                );
            });
        }
      });
    },
    [token, navigate, setToken, setUserId]
  );

  // Function to fetch the messages of the active conversation (channel or user)
  const fetchMessages = useCallback(() => {
    console.log("Fetching messages...for conv:", activeConversationRef.current);
    if (activeConversationRef.current) {
      const endpoint = isChannel(activeConversationRef.current)
        ? `http://${localhost}:3333/chat/channel/${activeConversationRef.current.id}/messages` // If the active conversation is a channel, fetch the channel messages
        : `http://${localhost}:3333/chat/${activeConversationRef.current.id}`; // If the active conversation is a user, fetch the private messages

      fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          checkTokenExpiration(response, navigate, setToken, setUserId);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setMessages(data);
          markMessagesAsRead(data);
        })
        .catch((error) => {
          if (error.message !== "Unauthorized")
            console.error(
              "An error occurred while fetching the messages:",
              error
            );
        });
    }
  }, [token, navigate, setToken, setUserId, markMessagesAsRead, setMessages]);

  const fetchCurrentUser = useCallback(() => {
    fetch(`http://${localhost}:3333/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        checkTokenExpiration(response, navigate, setToken, setUserId);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        setMyAvatarURL(data.avatar);
      })
      .catch((error) => {
        if (error.message !== "Unauthorized")
          console.error("An error occurred while fetching the user:", error);
      });
  }, [token, navigate, setToken, setUserId]);

  const fetchUsers = useCallback(() => {
    fetch(`http://${localhost}:3333/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        checkTokenExpiration(response, navigate, setToken, setUserId);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Remove the currently logged in user from the list
        const filteredData = data.filter((user: IUser) => user.id !== userId);
        setUsers(filteredData);
      })
      .catch((error) => {
        if (error.message !== "Unauthorized")
          console.error("An error occurred while fetching the users:", error);
      });
  }, [token, navigate, setToken, setUserId, userId]);

  //////////////////////////////////////// SOCKET EVENTS HANDLERS ////////////////////////////////////////

  const joinChannelCallback = useCallback(
    (channel: IChannel, userJoiningChannel: IUser) => {
      console.log("User joining channel", userJoiningChannel);
      // If the user joining the channel is the currently logged in user or the active conversation is not the channel being joined, refresh the channels
      if (
        userJoiningChannel.id === userId ||
        !activeConversationRef.current ||
        activeConversationRef.current.id !== channel.id
      ) {
        fetchChannels();
      }
      // Else, add the user to the list of users in the channel
      else {
        setActiveConversation((prevActiveConversation) => {
          if (
            prevActiveConversation &&
            isChannel(prevActiveConversation) &&
            prevActiveConversation.id === channel.id
          ) {
            // Create a new object and modify it to avoid directly modifying state
            const updatedActiveConversation = { ...prevActiveConversation };
            const isUserAlreadyMember = updatedActiveConversation.members.some(
              (member) => member.id === userJoiningChannel.id
            ); // Check if the user is already a member of the channel
            if (!isUserAlreadyMember)
              updatedActiveConversation.members.push(userJoiningChannel);
            return updatedActiveConversation;
          } else {
            return prevActiveConversation;
          }
        });
      }
    },
    [userId, setActiveConversation, fetchChannels]
  );

  const leaveChannelCallback = useCallback(
    (channel: IChannel, userLeavingChannel: IUser) => {
      console.log("User leaving channel", userLeavingChannel);
      // If the user leaving the channel is the currently logged in user or the active conversation is not the channel being left, refresh the channels
      if (
        userLeavingChannel.id === userId ||
        !activeConversationRef.current ||
        activeConversationRef.current.id !== channel.id
      ) {
        fetchChannels();
        // If the active conversation is the channel being left, set the active conversation to null
        if (
          activeConversationRef.current &&
          isChannel(activeConversationRef.current) &&
          activeConversationRef.current.id === channel.id
        ) {
          setActiveConversation(null);
        }
      }
      // Else, remove the user from the list of users in the channel
      else {
        setActiveConversation((prevActiveConversation) => {
          if (
            prevActiveConversation &&
            isChannel(prevActiveConversation) &&
            prevActiveConversation.id === channel.id
          ) {
            // Create a new object and modify it to avoid directly modifying state
            const updatedActiveConversation = { ...prevActiveConversation };
            updatedActiveConversation.members =
              updatedActiveConversation.members.filter(
                (member) => member.id !== userLeavingChannel.id
              );
            return updatedActiveConversation;
          } else {
            return prevActiveConversation;
          }
        });
      }
    },
    [userId, setActiveConversation, fetchChannels]
  );

  const updateChannelCallback = useCallback(
    (channel: IChannel) => {
      console.log("Channel updated", channel);
      // If the active conversation is the channel being updated, update the active conversation
      if (
        activeConversationRef.current &&
        isChannel(activeConversationRef.current) &&
        activeConversationRef.current.id === channel.id
      ) {
        setActiveConversation(channel);
      }
      // Update the channel in the channels list
      setChannels((channels) =>
        channels.map((channelInList) => {
          if (channelInList.id === channel.id) return channel;
          else return channelInList;
        })
      );
    },
    [setActiveConversation]
  );

  const receiveMessageCallback = useCallback(
    (message: IMessage) => {
      console.log("Received message:", message);
      // If the message is for the active conversation, refresh the messages
      if (
        activeConversationRef.current &&
        (message.senderId === userId ||
          message.receiverId === activeConversationRef.current.id ||
          (!message.isChannelMessage && message.receiverId === userId)) &&
        ((message.isChannelMessage &&
          isChannel(activeConversationRef.current)) ||
          (!message.isChannelMessage &&
            !isChannel(activeConversationRef.current)))
      ) {
        console.log("Refreshing messages...");
        fetchMessages();
      } else {
        // If the message is not for the active conversation, update the unread messages count
        if (message.isChannelMessage) {
          setChannels((channels) =>
            channels.map((channel) => {
              if (channel.id === message.receiverId) {
                return { ...channel, unreadCount: channel.unreadCount + 1 };
              } else {
                return channel;
              }
            })
          );
        } else {
          setUsers((users) =>
            users.map((user) => {
              if (
                user.id === message.senderId ||
                user.id === message.receiverId
              ) {
                return { ...user, unreadCount: user.unreadCount + 1 };
              } else {
                return user;
              }
            })
          );
        }
      }
    },
    [userId, fetchMessages, setChannels, setUsers]
  );

  const reloadMessagesCallback = useCallback(() => {
    console.log("Reloading messages...");
    fetchMessages();
  }, [fetchMessages]);

  const updateConnectionStatusCallback = useCallback((data: any) => {
    const userId = data.userId;
    const status = data.status;
    // console.log("Updating connection status for user:", userId, "Status:", status);

    // Update connection status for user in messages of active conversation
    setMessages((messages) =>
      messages.map((message) => {
        if (message.senderId === userId) {
          return {
            ...message,
            sender: { ...message.sender, connectionStatus: status },
          };
        } else {
          return message;
        }
      })
    );
    // Update connection status for user in channel users list of active conversation
    if (
      activeConversationRef.current &&
      isChannel(activeConversationRef.current)
    ) {
      setActiveConversation((prevActiveConversation) => {
        //TODO: fetchMessages is called because activeConversation's value is changed !!!
        if (
          prevActiveConversation &&
          isChannel(prevActiveConversation) &&
          activeConversationRef.current &&
          activeConversationRef.current.id &&
          prevActiveConversation.id === activeConversationRef.current.id
        ) {
          // Create a new object and modify it to avoid directly modifying state
          const updatedActiveConversation = { ...prevActiveConversation };
          // Update members
          updatedActiveConversation.members =
            updatedActiveConversation.members.map((member) => {
              if (member.id === userId) {
                return { ...member, connectionStatus: status };
              } else {
                return member;
              }
            });
          // Update owner
          if (updatedActiveConversation.owner.id === userId) {
            updatedActiveConversation.owner = {
              ...updatedActiveConversation.owner,
              connectionStatus: status,
            };
          }
          // Update admins
          updatedActiveConversation.admins =
            updatedActiveConversation.admins.map((admin) => {
              if (admin.userId === userId) {
                return { ...admin, connectionStatus: status };
              } else {
                return admin;
              }
            });
          return updatedActiveConversation;
        } else {
          return prevActiveConversation;
        }
      });
    }
  }, []);

  const updateCurrentLocationCallback = useCallback((data: any) => {
    const userId = data.userId;
    const location = data.location;
    // console.log("Updating current location for user:", userId, "Location:", location);
    // Update current location for user in channel users list of active conversation
    if (
      activeConversationRef.current &&
      isChannel(activeConversationRef.current)
    ) {
      setActiveConversation((prevActiveConversation) => {
        //TODO: fetchMessages is called because activeConversation's value is changed !!!
        if (
          prevActiveConversation &&
          isChannel(prevActiveConversation) &&
          activeConversationRef.current &&
          activeConversationRef.current.id &&
          prevActiveConversation.id === activeConversationRef.current.id
        ) {
          // Create a new object and modify it to avoid directly modifying state
          const updatedActiveConversation = { ...prevActiveConversation };
          // Update members
          updatedActiveConversation.members =
            updatedActiveConversation.members.map((member) => {
              if (member.id === userId) {
                return { ...member, currentLocation: location };
              } else {
                return member;
              }
            });
          // Update owner
          if (updatedActiveConversation.owner.id === userId) {
            updatedActiveConversation.owner = {
              ...updatedActiveConversation.owner,
              currentLocation: location,
            };
          }
          // Update admins
          updatedActiveConversation.admins =
            updatedActiveConversation.admins.map((admin) => {
              if (admin.userId === userId) {
                return { ...admin, currentLocation: location };
              } else {
                return admin;
              }
            });
          return updatedActiveConversation;
        } else {
          return prevActiveConversation;
        }
      });
    }
  }, []);

  const notifyFriendRequest = useCallback((senderUsername: string) => {
    toast.info(`${senderUsername} sent you a friend request!`, {
      className: "toast-message",
    });
  }, []);

  //////////////////////////////////////// EVENT HANDLERS ////////////////////////////////////////
  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();

    if (message && activeConversation && socketRef.current) {
      // If the active conversation is a channel, set the isChannelMessage flag to true
      if (isChannel(activeConversation))
        socketRef.current.emit("sendMessage", {
          content: message,
          senderId: userId,
          receiverId: activeConversation.id,
          isChannelMessage: true,
        });
      else
        socketRef.current.emit("sendMessage", {
          content: message,
          senderId: userId,
          receiverId: activeConversation.id,
        });
      setMessage("");
    }
  };

  const handleOpenProfile = (userId: number | null) => {
    setSelectedUserId(userId);
    setProfileOpen(true);
  };
  //////////////////////////////////////// USE EFFECTS ////////////////////////////////////////

  useEffect(() => {
    // Set up socket connection
    let newSocket: Socket | null = null;
    if (!socketRef.current && userId) {
      console.log("Connecting to chat socket...");
      newSocket = io(`http://${localhost}:3333/chat`, {
        query: {
          userId: userId,
        },
      });
      socketRef.current = newSocket;
    }

    // Set up socket event handlers
    if (socketRef.current) {
      socketRef.current.on("receiveMessage", receiveMessageCallback);
      socketRef.current.on("joinChannel", joinChannelCallback);
      socketRef.current.on("leaveChannel", leaveChannelCallback);
      socketRef.current.on("updateChannel", updateChannelCallback);
      socketRef.current.on("reloadMessages", reloadMessagesCallback);
      socketRef.current.on(
        "updateConnectionStatus",
        updateConnectionStatusCallback
      );
      socketRef.current.on(
        "updateCurrentLocation",
        updateCurrentLocationCallback
      );
      socketRef.current.on("notifyFriendRequest", notifyFriendRequest);
    }

    //Clean up function
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting chat socket...");
        socketRef.current.off("receiveMessage");
        socketRef.current.off("joinChannel");
        socketRef.current.off("leaveChannel");
        socketRef.current.off("updateChannel");
        socketRef.current.off("reloadMessages");
        socketRef.current.off("updateConnectionStatus");
        socketRef.current.off("updateCurrentLocation");
        socketRef.current.off("notifyFriendRequest");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [
    userId,
    receiveMessageCallback,
    joinChannelCallback,
    leaveChannelCallback,
    updateChannelCallback,
    reloadMessagesCallback,
    updateConnectionStatusCallback,
    updateCurrentLocationCallback,
    notifyFriendRequest,
  ]);

  useEffect(() => {
    // Update the active conversation ref when the active conversation changes
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    // Fetch the messages of the active conversation
    if (activeConversation) {
      fetchMessages();
      firstScroll.current = true;
    }
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    // Scroll to the bottom of the messages list when the messages change
    // messagesEndRef is a reference to the last message in the list
    if (firstScroll.current === true) {
      // Don't scroll on first render, directly jump to the bottom
      messagesEndRef.current?.scrollIntoView();
      firstScroll.current = false;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch the currently logged in user from the API
  // Fetch the users and channels from the API
  useEffect(() => {
    if (userId) {
      fetchCurrentUser();
      fetchUsers();
      fetchChannels();
    }
  }, [userId, fetchCurrentUser, fetchUsers, fetchChannels]);

  //////////////////////////////////////// RENDER ////////////////////////////////////////

  return (
    <MainContainer>
      <LeftSideBarContainer>
        <NavBox />
        <ManageChannels channels={channels} socketRef={socketRef} />
        <Conversations
          activeConversation={activeConversation}
          setActiveConversation={setActiveConversation}
          users={users}
          channels={channels}
        />
        <LogoutContainer>
          <Logout />
        </LogoutContainer>
      </LeftSideBarContainer>
      <div className={styles["chat-container"]}>
        <div className={styles["chat-messages"]}>
          {messages
            .filter(
              (m) =>
                m.receiverId === activeConversation?.id ||
                m.senderId === activeConversation?.id
            )
            .map((message, i) => (
              <div
                key={i}
                className={`${styles["message-container"]} ${
                  message.senderId === userId ? styles["my-message"] : ""
                }`}
                ref={messagesEndRef}
              >
                <Button
                  disableRipple
                  onClick={(e) => handleOpenProfile(message.senderId)}
                  style={{ backgroundColor: "transparent" }}
                >
                  <div className={styles["avatar-container"]}>
                    <div
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "40px",
                        height: "40px",
                      }}
                    >
                      <img
                        src={
                          message.senderId === userId
                            ? myAvatarURL
                            : message.sender?.avatar
                        }
                        alt="avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                        }}
                      />
                      {message.sender?.connectionStatus !== null && message.sender?.connectionStatus !== undefined ? (
                        <span
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            backgroundColor:
                              message.sender?.connectionStatus ===
                              ConnectionStatus.ONLINE
                                ? "green"
                                : "grey",
                          }}
                        ></span>
                      ) : null}
                    </div>
                  </div>
                </Button>
                <div className={styles["message-content-container"]}>
                  <Button
                    disableRipple
                    onClick={(e) => handleOpenProfile(message.senderId)}
                    style={{ backgroundColor: "transparent" }}
                  >
                    <p className={styles["message-sender"]}>
                      {message.senderId === userId
                        ? user?.username
                        : message.sender?.username}
                    </p>
                  </Button>
                  <p className={styles["message-content"]}>{message.content}</p>
                  <p className={styles["message-timestamp"]}>
                    {message.createdAt.toLocaleString()}
                  </p>
                </div>
                <PublicProfile
                  userId={selectedUserId}
                  open={isProfileOpen}
                  onClose={() => setProfileOpen(false)}
                />
              </div>
            ))}
        </div>
        {activeConversation && (
          <form onSubmit={sendMessage} className={styles["chat-input"]}>
            <input
              name="type_a_message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        )}
      </div>
      {activeConversation && isChannel(activeConversation) && (
        <ChannelSidebar
          activeChannel={activeConversation}
          socket={socketRef.current}
        />
      )}
    </MainContainer>
  );
}

export default Chat;
