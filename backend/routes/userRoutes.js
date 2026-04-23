const express = require('express');
const router = express.Router();
const {
  updateProfile,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  updateLocation,
  getLocationHistory,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/profile', updateProfile);
router.get('/contacts', getContacts);
router.post('/contacts', addContact);
router.put('/contacts/:id', updateContact);
router.delete('/contacts/:id', deleteContact);
router.post('/location', updateLocation);
router.get('/location-history', getLocationHistory);

module.exports = router;
