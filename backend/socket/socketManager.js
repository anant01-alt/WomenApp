const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // Join user's personal room
    socket.join(`user_${socket.user._id}`);

    // Broadcast user online status
    socket.broadcast.emit('user_online', { userId: socket.user._id, name: socket.user.name });

    // ─── LOCATION TRACKING ───────────────────────────────────────────────
    socket.on('location_update', async (data) => {
      const { lat, lng, alertId } = data;
      try {
        // Update user's last location in DB
        await User.findByIdAndUpdate(socket.user._id, {
          lastLocation: { lat, lng, updatedAt: new Date() },
        });

        // Broadcast to all watchers of this user
        socket.to(`watching_${socket.user._id}`).emit('location_update', {
          userId: socket.user._id,
          userName: socket.user.name,
          lat,
          lng,
          timestamp: new Date(),
          alertId,
        });

        // If active alert, broadcast to alert room
        if (alertId) {
          socket.to(`alert_${alertId}`).emit('alert_location', { lat, lng, timestamp: new Date() });
        }
      } catch (err) {
        console.error('Location update error:', err.message);
      }
    });

    // ─── WATCH USER LOCATION ─────────────────────────────────────────────
    socket.on('watch_user', (userId) => {
      socket.join(`watching_${userId}`);
      console.log(`👁️  ${socket.user.name} watching location of user ${userId}`);
    });

    socket.on('unwatch_user', (userId) => {
      socket.leave(`watching_${userId}`);
    });

    // ─── CHAT ─────────────────────────────────────────────────────────────
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`💬 ${socket.user.name} joined room: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
    });

    socket.on('send_message', async (data) => {
      const { room, content, receiverId, type, alertId } = data;
      try {
        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        if (!room || !trimmedContent) {
          throw new Error('Message content required');
        }

        const message = await Message.create({
          sender: socket.user._id,
          receiver: receiverId || null,
          room,
          content: trimmedContent,
          type: type || 'text',
          alert: alertId || null,
        });

        const populated = await message.populate('sender', 'name avatar');

        // Broadcast to room
        io.to(room).emit('new_message', populated);
      } catch (err) {
        socket.emit('message_error', { error: err.message });
      }
    });

    socket.on('typing', (data) => {
      socket.to(data.room).emit('user_typing', {
        room: data.room,
        userId: socket.user._id,
        name: socket.user.name,
        isTyping: data.isTyping,
      });
    });

    // ─── SOS ──────────────────────────────────────────────────────────────
    socket.on('join_alert', (alertId) => {
      socket.join(`alert_${alertId}`);
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
      socket.broadcast.emit('user_offline', { userId: socket.user._id });
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
