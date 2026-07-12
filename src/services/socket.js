import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';

let socket = null;

/**
 * Connect to Socket.io backend with token authentication
 * @param {string} token 
 */
export const initiateSocketConnection = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: false,
  });

  return socket;
};

/**
 * Terminate socket session
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Retrieve active socket instance
 */
export const getSocket = () => socket;
