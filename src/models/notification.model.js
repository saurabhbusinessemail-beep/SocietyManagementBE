const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  toUserId: { type: String }, // single recipient
  toUserIds: [{ type: String }], // batch recipients
  title: { type: String },
  body: { type: String },
  type: { type: String, enum: ['info', 'warning', 'alert', 'transactional', 'system'], default: 'info' },
  isRead: { type: Boolean, default: false },
  payload: { type: mongoose.Schema.Types.Mixed }, // extra data
  channel: { type: String, enum: ['inapp', 'email', 'sms', 'push'], default: 'inapp' },
  sentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
