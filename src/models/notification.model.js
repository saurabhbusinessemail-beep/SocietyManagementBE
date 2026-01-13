const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    // Who will receive the notification
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Optional society / group context
    societyId: {
      type: mongoose.Types.ObjectId,
      ref: 'Society',
      index: true
    },

    // Notification type (for UI routing / icons)
    type: {
      type: String,
      required: true,
      enum: ['COMPLAINT', 'ANNOUNCEMENT', 'PAYMENT', 'GATE_PASS', 'GENERAL']
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    // Extra data for deep linking / navigation
    data: {
      type: Object, // example: { complaintId, route, flatId }
      default: {}
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },

    readAt: {
      type: Date
    },

    // Optional sender (admin / system / user)
    triggeredByUserId: {
      type: mongoose.Types.ObjectId,
      ref: 'User'
    },

    ...require('./default-fields.model')
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
