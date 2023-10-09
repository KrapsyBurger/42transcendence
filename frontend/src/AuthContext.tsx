import React from "react";
// import { Socket } from 'socket.io-client';

// Create a context to store the token and the function to set the token
export const AuthContext = React.createContext<{
  // Type definition for the context value
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  userId: number | null;
  setUserId: React.Dispatch<React.SetStateAction<number | null>>;
  // socket: Socket | null;
  // setSocket: React.Dispatch<React.SetStateAction<Socket | null>>;
}>({
  // Default value for the context
  token: null,
  setToken: () => {},
  userId: null,
  setUserId: () => {},
  // socket: null,
  // setSocket: () => {},
});
