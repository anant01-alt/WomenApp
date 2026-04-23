const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getChatRooms } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/rooms', getChatRooms);
router.get('/:room', getMessages);
router.post('/:room', sendMessage);

module.exports = router;
