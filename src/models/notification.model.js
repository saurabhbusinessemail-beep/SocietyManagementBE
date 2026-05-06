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
      enum: ['COMPLAINT', 'ANNOUNCEMENT', 'PAYMENT', 'GATE_PASS', 'GATE_PASS_RESPONSE', 'GATE_EXIT', 'OTP', 'GENERAL', 'SOCIETY_APPROVED', 'SOCIETY_REJECTED', 'APPROVAL_REQUEST', 'APPROVAL_RESPONSE', 'MAINTENANCE_PAYMENT_REQUEST', 'MAINTENANCE_PAYMENT_RESPONSE', 'MAINTENANCE_PAYMENT', 'MAINTENANCE_REMINDER', 'RENT_REMINDER', 'RENT_PAYMENT', 'RENT_PAYMENT_RESPONSE', 'TENANT_DOCUMENT', 'TENANT_DOCUMENT_RESPONSE', 'TENANT_DOCUMENT_REMINDER']
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

// Unread count and listing — most frequent query
NotificationSchema.index({ userId: 1, isRead: 1 });
// Society-scoped notifications
NotificationSchema.index({ userId: 1, societyId: 1, isRead: 1 });
// Type filter for routing/deep links
NotificationSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
