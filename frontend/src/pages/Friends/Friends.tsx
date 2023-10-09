// Components
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import SideBar from "../../components/sidebar/SideBar";

// Styles
import { FriendsPageContainer, FriendsTableContainer } from "./Friends.styles";
import { FriendsTable } from "./components/FriendsTable";
import { Socket, io } from "socket.io-client";
import { AuthContext } from "../../AuthContext";
import { IFriend, IFriendRequest } from "../../interfaces/interfaces";
import { fetchFriends, fetchFriendRequests } from "../../api.utils";
import { toast } from "react-toastify";
import { localhost } from "../../api"; 

const Friends = () => {
  const socketRef = useRef<Socket | null>(null);
  const { userId } = useContext(AuthContext);
  const [friends, setFriends] = useState<IFriend[]>([]); // Friends state also used in All.tsx component
  const [friendRequests, setFriendRequests] = useState<IFriendRequest[]>([]); // Friend requests state also used in Pending.tsx component


  const updateFriendsCallback = useCallback ( //TODO: optimize to only update the friend that changed
    () => {
    fetchFriends()
      .then((friendsData: IFriend[]) => {
        setFriends(friendsData);
      })
      .catch((error) => {
        console.error("Error fetching friends data:", error);
      });
  }, [ setFriends ]);

  const updateFriendsRequestsCallback = useCallback (
  () => {
    fetchFriendRequests()
      .then((friendRequestsData: IFriendRequest[]) => {
        setFriendRequests(friendRequestsData);
      }
      )
      .catch((error) => {
        console.error("Error fetching friend requests data:", error);
      }
      );
  }, [  ]);

  const notifyFriendRequest = useCallback (
    (senderUsername: string) => {
    toast.info(`${senderUsername} sent you a friend request!`, {
      className: "toast-message",
    });
  }
  , [  ]);

  useEffect(() => {
    // Set up socket connection
    let newSocket: Socket | null = null;
    if (!socketRef.current && userId) {
      console.log("Connecting to friend socket...");
      newSocket = io(`http://${localhost}:3333/friend`, {
        query: {
          userId: userId,
        },
      });
      socketRef.current = newSocket;

    }

    // Set up socket event handlers
    if (socketRef.current) {
      socketRef.current.on("updateFriends", updateFriendsCallback);
      socketRef.current.on("updateFriendRequests", updateFriendsRequestsCallback);
      socketRef.current.on("notifyFriendRequest", notifyFriendRequest);
      socketRef.current.on("updateConnectionStatus", updateFriendsCallback);
      socketRef.current.on("updateCurrentLocation", updateFriendsCallback);
    }

    //Clean up function
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting friend socket...");
        socketRef.current.off("updateFriends", updateFriendsCallback);
        socketRef.current.off("updateFriendRequests", updateFriendsRequestsCallback);
        socketRef.current.off("notifyFriendRequest", notifyFriendRequest);
        socketRef.current.off("updateConnectionStatus", updateFriendsCallback);
        socketRef.current.off("updateCurrentLocation", updateFriendsCallback);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, updateFriendsCallback, updateFriendsRequestsCallback, notifyFriendRequest]);

  return (
    <FriendsPageContainer>
      <SideBar />
      <FriendsTableContainer>
        <FriendsTable friends={friends} setFriends={setFriends} friendRequests={friendRequests} setFriendRequests={setFriendRequests} />
      </FriendsTableContainer>
    </FriendsPageContainer>
  );
};

export default Friends;
