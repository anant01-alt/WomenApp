import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (room) => socket?.emit('join_room', room);
export const leaveRoom = (room) => socket?.emit('leave_room', room);
export const sendTyping = (room, isTyping) => socket?.emit('typing', { room, isTyping });

export const emitLocation = (lat, lng, alertId = null) => {
  socket?.emit('location_update', { lat, lng, alertId });
};

export const watchUser = (userId) => socket?.emit('watch_user', userId);
export const unwatchUser = (userId) => socket?.emit('unwatch_user', userId);

export default { initSocket, getSocket, disconnectSocket, joinRoom, leaveRoom, emitLocation };
