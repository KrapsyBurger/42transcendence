// Packages
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { StatusText } from "./All.styles";
import { localhost } from "../../../../api";

interface UserStatusComponentProps {
  userId: number;
}

const UserStatusComponent = ({
  userId,
}: UserStatusComponentProps): JSX.Element => {
  const [userStatus, setUserStatus] = useState(null);

  const fetchUserStatus = (userId: number) => {
    const socket = io(`http://${localhost}:3333`);

    socket.emit("getUserStatus", userId); // Request the status of the specified user

    socket.on("userStatus", (data) => {
      setUserStatus(data);
      socket.disconnect(); // Disconnect after receiving the user status
    });
  };

  useEffect(() => {
    fetchUserStatus(userId);
  }, [userId]);
  console.log("Loggin user status");
  console.log(userStatus);
  return <StatusText primary={userStatus} />;
};

export default UserStatusComponent;
