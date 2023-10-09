// Connect to the connection namespace websocket to track new connections and disconnections
import io from 'socket.io-client';
import { localhost } from '../api';

const socket = io(`http://${localhost}:3333/connection`);

export const connectToConnectionSocket = (userId: number) => {
	console.log('Connecting to user connection namespace');
	const socket = io(`http://${localhost}:3333/connection`, {
	  query: {
		userId: userId,
	  },
	});
  
	socket.on('connect', () => {
	  console.log('Connected to user connection namespace');
	});
  
	socket.on('disconnect', () => {
	  console.log('Disconnected from user connection namespace');
	});
  
	return socket;
  };
  
  

export const disconnectFromConnectionSocket = () => {
  socket.disconnect();
};
