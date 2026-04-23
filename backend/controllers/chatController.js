const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get messages for a room
// @route   GET /api/chat/:room
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { room } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ room })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar');

    const total = await Message.countDocuments({ room });

    // Mark messages as read
    await Message.updateMany(
      { room, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a message (REST fallback)
// @route   POST /api/chat/:room
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { room } = req.params;
    const { content, receiverId, type, alertId } = req.body;
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (!room || !trimmedContent) {
      return res.status(400).json({ success: false, message: 'Message content required' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId || null,
      room,
      content: trimmedContent,
      type: type || 'text',
      alert: alertId || null,
    });

    const populated = await message.populate('sender', 'name avatar');

    // Emit via socket
    const { getIO } = require('../socket/socketManager');
    const io = getIO();
    if (io) {
      io.to(room).emit('new_message', populated);
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all chat rooms for a user
// @route   GET /api/chat/rooms
// @access  Private
const getChatRooms = async (req, res) => {
  try {
    // Get latest message per room involving this user
    const rooms = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { receiver: req.user._id },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$room',
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', req.user._id] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMessages, sendMessage, getChatRooms };
