const Alert = require('../models/Alert');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const LocationLog = require('../models/LocationLog');

// Mock SMS service (replace with Twilio in production)
const sendMockSMS = async (phone, message) => {
  console.log(`📱 [MOCK SMS] To: ${phone} | Message: ${message}`);
  // In production, use Twilio:
  // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: phone });
  return true;
};

// @desc    Trigger SOS Alert
// @route   POST /api/sos/trigger
// @access  Private
const triggerSOS = async (req, res) => {
  try {
    const { lat, lng, address, message } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Location coordinates required for SOS' });
    }

    // Get user's emergency contacts
    const contacts = await EmergencyContact.find({ user: req.user._id, isNotified: true });

    // Create the alert
    const alert = await Alert.create({
      user: req.user._id,
      type: 'sos',
      status: 'active',
      location: { lat, lng, address: address || '' },
      message: message || 'Emergency! I need help immediately!',
      notifiedContacts: contacts.map((c) => ({
        contact: c._id,
        name: c.name,
        phone: c.phone,
        method: 'mock',
      })),
      locationHistory: [{ lat, lng, timestamp: new Date() }],
    });

    // Update user safety status
    await User.findByIdAndUpdate(req.user._id, { safetyStatus: 'emergency' });

    // Log location
    await LocationLog.create({ user: req.user._id, lat, lng, isEmergency: true, alert: alert._id });

    // Send mock SMS to all contacts
    const user = await User.findById(req.user._id);
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const smsMessage = `🚨 EMERGENCY ALERT from ${user.name}! She needs help immediately.\nLocation: ${mapsLink}\nMessage: ${alert.message}`;

    for (const contact of contacts) {
      await sendMockSMS(contact.phone, smsMessage);
    }

    // Emit socket event
    const { getIO } = require('../socket/socketManager');
    const io = getIO();
    if (io) {
      io.emit('sos_triggered', {
        alertId: alert._id,
        userId: req.user._id,
        userName: user.name,
        location: { lat, lng, address },
        message: alert.message,
        timestamp: new Date(),
      });

      // Notify specific contact rooms
      contacts.forEach((contact) => {
        io.to(`contact_${contact._id}`).emit('sos_alert', {
          alertId: alert._id,
          from: user.name,
          location: { lat, lng },
          message: alert.message,
        });
      });
    }

    res.status(201).json({
      success: true,
      message: `SOS triggered! Notified ${contacts.length} contact(s)`,
      alert,
      notifiedCount: contacts.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update SOS location (during active emergency)
// @route   PUT /api/sos/:id/location
// @access  Private
const updateSOSLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.locationHistory.push({ lat, lng, timestamp: new Date() });
    alert.location = { lat, lng, address: alert.location.address };
    await alert.save();

    // Emit location update
    const { getIO } = require('../socket/socketManager');
    const io = getIO();
    if (io) {
      io.emit(`alert_location_${alert._id}`, { lat, lng, timestamp: new Date() });
    }

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel/Resolve SOS Alert
// @route   PUT /api/sos/:id/resolve
// @access  Private
const resolveAlert = async (req, res) => {
  try {
    const { status } = req.body; // 'resolved', 'cancelled', 'false-alarm'
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id });

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.status = status || 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    // Reset user safety status
    await User.findByIdAndUpdate(req.user._id, { safetyStatus: 'safe' });

    // Notify contacts that emergency is over
    const { getIO } = require('../socket/socketManager');
    const io = getIO();
    if (io) {
      io.emit('alert_resolved', { alertId: alert._id, status: alert.status });
    }

    res.json({ success: true, message: 'Alert resolved', alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's alert history
// @route   GET /api/sos/history
// @access  Private
const getAlertHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const alerts = await Alert.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('notifiedContacts.contact', 'name phone');

    const total = await Alert.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active alert for user
// @route   GET /api/sos/active
// @access  Private
const getActiveAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({ user: req.user._id, status: 'active' })
      .sort({ createdAt: -1 })
      .populate('notifiedContacts.contact', 'name phone');

    res.json({ success: true, alert: alert || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single alert
// @route   GET /api/sos/:id
// @access  Private
const getAlert = async (req, res) => {
  try {
    const alert = await Alert.findOne({ _id: req.params.id, user: req.user._id })
      .populate('notifiedContacts.contact', 'name phone');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { triggerSOS, updateSOSLocation, resolveAlert, getAlertHistory, getActiveAlert, getAlert };
