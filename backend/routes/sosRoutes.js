const express = require('express');
const router = express.Router();
const {
  triggerSOS,
  updateSOSLocation,
  resolveAlert,
  getAlertHistory,
  getActiveAlert,
  getAlert,
} = require('../controllers/sosController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/trigger', triggerSOS);
router.get('/active', getActiveAlert);
router.get('/history', getAlertHistory);
router.get('/:id', getAlert);
router.put('/:id/location', updateSOSLocation);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
