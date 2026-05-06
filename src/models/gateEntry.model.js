const mongoose = require('mongoose');

const GateEntryHistorySchema = new mongoose.Schema(
  {
    fromStatus: { type: String, enum: ['requested', 'approved', 'rejected', 'cancelled', 'expired', 'completed'] },
    toStatus: { type: String, enum: ['requested', 'approved', 'rejected', 'cancelled', 'expired', 'completed'] },
    note: { type: String },

    ...require('./default-fields.model')
  },
  { _id: false }
);

const GateEntrySchema = new mongoose.Schema(
  {
    gatePassId: { type: mongoose.Types.ObjectId, ref: 'Flat' }, // optional external id
    societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
    flatId: { type: mongoose.Types.ObjectId, ref: 'Flat' },
    visitorName: { type: String },
    visitorContact: { type: String },
    purpose: { type: String },
    vehicleNumber: { type: String },
    entryTime: { type: Date, required: true },
    exitTime: { type: Date },
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'cancelled', 'expired', 'completed'],
      default: 'requested',
      required: true
    },
    approvedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    history: [GateEntryHistorySchema],
    expiryDate: { type: Date },
    meta: { type: mongoose.Schema.Types.Mixed },

    ...require('./default-fields.model')
  },
  { timestamps: true }
);

// Primary list queries: gate entries per society filtered by status
GateEntrySchema.index({ societyId: 1, status: 1 });
// Flat-level gate entry lookup
GateEntrySchema.index({ societyId: 1, flatId: 1 });
GateEntrySchema.index({ societyId: 1, flatId: 1, status: 1 });
// Time-range queries used in reports / dashboards
GateEntrySchema.index({ societyId: 1, entryTime: -1 });

module.exports = mongoose.model('GateEntry', GateEntrySchema);
