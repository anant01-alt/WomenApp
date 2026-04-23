const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const LocationLog = require('../models/LocationLog');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, avatar },
      { new: true, runValidators: true }
    ).populate('emergencyContacts');

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all emergency contacts
// @route   GET /api/users/contacts
// @access  Private
const getContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ isPrimary: -1, createdAt: 1 });
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add emergency contact
// @route   POST /api/users/contacts
// @access  Private
const addContact = async (req, res) => {
  try {
    const { name, phone, email, relationship, isPrimary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    // Check contact limit (max 5)
    const count = await EmergencyContact.countDocuments({ user: req.user._id });
    if (count >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 emergency contacts allowed' });
    }

    // If this is primary, unset others
    if (isPrimary) {
      await EmergencyContact.updateMany({ user: req.user._id }, { isPrimary: false });
    }

    const contact = await EmergencyContact.create({
      user: req.user._id,
      name,
      phone,
      email: email || '',
      relationship: relationship || 'other',
      isPrimary: isPrimary || false,
    });

    // Add to user's contact list
    await User.findByIdAndUpdate(req.user._id, {
      $push: { emergencyContacts: contact._id },
    });

    res.status(201).json({ success: true, message: 'Contact added', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update emergency contact
// @route   PUT /api/users/contacts/:id
// @access  Private
const updateContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findOne({ _id: req.params.id, user: req.user._id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const { name, phone, email, relationship, isPrimary } = req.body;

    if (isPrimary) {
      await EmergencyContact.updateMany({ user: req.user._id, _id: { $ne: req.params.id } }, { isPrimary: false });
    }

    const updated = await EmergencyContact.findByIdAndUpdate(
      req.params.id,
      { name, phone, email, relationship, isPrimary },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Contact updated', contact: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete emergency contact
// @route   DELETE /api/users/contacts/:id
// @access  Private
const deleteContact = async (req, res) => {
  try {
    const contact = await EmergencyContact.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { emergencyContacts: req.params.id },
    });

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user's last known location
// @route   POST /api/users/location
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      lastLocation: { lat, lng, updatedAt: new Date() },
    });

    // Log location
    await LocationLog.create({ user: req.user._id, lat, lng, accuracy: accuracy || null });

    // Emit via socket for real-time tracking (if in emergency)
    const { getIO } = require('../socket/socketManager');
    const io = getIO();
    if (io) {
      io.to(`user_${req.user._id}`).emit('location_update', {
        userId: req.user._id,
        lat,
        lng,
        timestamp: new Date(),
      });
    }

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get location history
// @route   GET /api/users/location-history
// @access  Private
const getLocationHistory = async (req, res) => {
  try {
    const logs = await LocationLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  updateProfile,
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  updateLocation,
  getLocationHistory,
};
