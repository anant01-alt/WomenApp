const User = require('../models/User');
const Alert = require('../models/Alert');
const Message = require('../models/Message');

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all alerts
// @route   GET /api/admin/alerts
// @access  Admin
const getAllAlerts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    const query = status ? { status } : {};

    const alerts = await Alert.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Alert.countDocuments(query);

    // Stats
    const stats = {
      total: await Alert.countDocuments(),
      active: await Alert.countDocuments({ status: 'active' }),
      resolved: await Alert.countDocuments({ status: 'resolved' }),
      falseAlarm: await Alert.countDocuments({ status: 'false-alarm' }),
    };

    res.json({
      success: true,
      alerts,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve alert (admin)
// @route   PUT /api/admin/alerts/:id/resolve
// @access  Admin
const adminResolveAlert = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: status || 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
        adminNotes: adminNotes || '',
      },
      { new: true }
    ).populate('user', 'name email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Reset user safety status
    await User.findByIdAndUpdate(alert.user._id, { safetyStatus: 'safe' });

    res.json({ success: true, message: 'Alert resolved', alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
// @access  Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot deactivate admin' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
    const totalAlerts = await Alert.countDocuments();
    const activeAlerts = await Alert.countDocuments({ status: 'active' });
    const resolvedAlerts = await Alert.countDocuments({ status: 'resolved' });

    // Last 7 days alerts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAlerts = await Alert.find({ createdAt: { $gte: sevenDaysAgo } })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: { totalUsers, activeUsers, totalAlerts, activeAlerts, resolvedAlerts },
      recentAlerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUsers, getAllAlerts, adminResolveAlert, toggleUserStatus, getDashboardStats };
