const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['sos', 'warning', 'check-in', 'fake-call'],
      default: 'sos',
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'cancelled', 'false-alarm'],
      default: 'active',
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: '' },
    },
    message: {
      type: String,
      default: 'Emergency! I need help immediately!',
    },
    notifiedContacts: [
      {
        contact: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyContact' },
        name: String,
        phone: String,
        notifiedAt: { type: Date, default: Date.now },
        method: { type: String, enum: ['sms', 'email', 'app', 'mock'], default: 'mock' },
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    locationHistory: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for efficient querying
alertSchema.index({ user: 1, createdAt: -1 });
alertSchema.index({ status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
