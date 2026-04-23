const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllAlerts,
  adminResolveAlert,
  toggleUserStatus,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/alerts', getAllAlerts);
router.put('/alerts/:id/resolve', adminResolveAlert);

module.exports = router;
