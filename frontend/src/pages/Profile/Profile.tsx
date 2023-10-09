// Packages
import { useCallback, useContext, useEffect, useRef } from "react";

// Components
import SideBar from "../../components/sidebar/SideBar";
import ProfileContent from "../../components/profile/ProfileContent";

// Styles
import { ProfilePageContainer } from "../../components/profile/Profile.styles";

// Context
import { AuthContext } from "../../AuthContext";
import { Socket, io } from "socket.io-client";
import { toast } from "react-toastify";
import { localhost } from "../../api";

const Profile = () => {
  const socketRef = useRef<Socket | null>(null);
  const { userId } = useContext(AuthContext);


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
      console.log("Connecting to profile socket...");
      newSocket = io(`http://${localhost}:3333/profile`, {
        query: {
          userId: userId,
        },
      });
      socketRef.current = newSocket;
    }

    // Set up socket event handlers
    if (socketRef.current) {
      socketRef.current.on("notifyFriendRequest", notifyFriendRequest);
    }

    //Clean up function
    return () => {
      if (socketRef.current) {
        console.log("Disconnecting profile socket...");
        socketRef.current.off("notifyFriendRequest", notifyFriendRequest);
        socketRef.current.disconnect();
        socketRef.current = null;

      }
    };
  }, [userId, notifyFriendRequest]);

  return (
    <ProfilePageContainer>
      <SideBar />
      <ProfileContent userId={userId} />
    </ProfilePageContainer>
  );
};

export default Profile;
