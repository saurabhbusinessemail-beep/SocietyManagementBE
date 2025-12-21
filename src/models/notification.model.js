const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  toUserId: { type: mongoose.Types.ObjectId, ref: 'User' }, // single recipient
  toUserIds: [{ type: mongoose.Types.ObjectId, ref: 'User' }], // batch recipients
  notificationType: { type: String, enum: ['Approval', 'Alert', 'Circular', 'Update', 'Events', 'Complaint'], default: 'info' },
  title: { type: String },
  body: { type: String },
  isRead: { type: Boolean, default: false },
  payload: { type: mongoose.Schema.Types.Mixed }, // extra data
  channel: { type: String, enum: ['inapp', 'email', 'sms', 'push'], default: 'inapp' },

  ...require('./default-fields.model')
  // sentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
