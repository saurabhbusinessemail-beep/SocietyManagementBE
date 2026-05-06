const mongoose = require('mongoose');

const MaintenanceReminderSchema = new mongoose.Schema({
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
  flatMemberId: { type: mongoose.Types.ObjectId, ref: 'FlatMember' },
  userId: { type: mongoose.Types.ObjectId, ref: 'User' }, // Recipient
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  sentBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  sentOn: { type: Date, default: Date.now },
  type: { type: String, enum: ['notification', 'sms', 'both'], default: 'notification' },
  ...require('./default-fields.model')
}, { timestamps: true });

MaintenanceReminderSchema.index({ flatId: 1, month: 1, year: 1 });
// Society-scoped queries used in admin/manager views
MaintenanceReminderSchema.index({ societyId: 1, month: 1, year: 1 });
MaintenanceReminderSchema.index({ societyId: 1, flatId: 1 });
// Type enum used in filtering
MaintenanceReminderSchema.index({ societyId: 1, type: 1 });

module.exports = mongoose.model('MaintenanceReminder', MaintenanceReminderSchema);
