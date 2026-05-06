const mongoose = require('mongoose');

const MaintenancePaymentSchema = new mongoose.Schema({
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
  flatMemberId: { type: mongoose.Types.ObjectId, ref: 'FlatMember', required: true },

  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  amount: { type: Number, required: true },

  // Optional payment method details
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'other']
  },
  paymentDetails: { type: mongoose.Schema.Types.Mixed },
  // e.g. { upiId: 'abc@upi', accountNumber: '...', accountName: '...', chequeNumber: '...' }

  paidOn: { type: Date },

  // Approval workflow
  status: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected'],
    default: 'pending_approval',
    required: true
  },
  recordedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  isAdminRecorded: { type: Boolean, default: false },

  note: { type: String },

  ...require('./default-fields.model')
}, { timestamps: true });

// Compound index: one payment per flat per month per year
MaintenancePaymentSchema.index({ societyId: 1, flatId: 1, month: 1, year: 1 });
// Status filter used in approval workflow admin view
MaintenancePaymentSchema.index({ societyId: 1, status: 1 });
// FlatMember ref used in detail views
MaintenancePaymentSchema.index({ flatMemberId: 1 });
// Flat-level listing sorted by period
MaintenancePaymentSchema.index({ flatId: 1, year: 1, month: 1 });

module.exports = mongoose.model('MaintenancePayment', MaintenancePaymentSchema);
