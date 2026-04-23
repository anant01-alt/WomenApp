const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    address: {
      type: String,
      default: '',
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      default: null,
    },
  },
  { timestamps: true }
);

locationLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('LocationLog', locationLogSchema);
