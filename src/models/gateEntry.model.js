const mongoose = require('mongoose');

const GateEntryHistorySchema = new mongoose.Schema(
  {
    fromStatus: { type: String },
    toStatus: { type: String },
    note: { type: String },

    ...require('./default-fields.model')
  },
  { _id: false }
);

const GateEntrySchema = new mongoose.Schema(
  {
    gatePassNumber: { type: String, unique: true }, // optional external id
    flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
    visitorName: { type: String, required: true },
    visitorContact: { type: String },
    purpose: { type: String },
    vehicleNumber: { type: String },
    entryTime: { type: Date },
    exitTime: { type: Date, required: true },
    expectedIn: { type: Date },
    expectedOut: { type: Date },
    status: {
      type: String,
      enum: [
        'requested',
        'approved',
        'rejected',
        'cancelled',
        'expired',
        'completed'
      ],
      default: 'requested'
    },
    approvedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    history: [GateEntryHistorySchema],
    expiryDate: { type: Date },
    OTP: { type: Number },
    meta: { type: mongoose.Schema.Types.Mixed },

    ...require('./default-fields.model')
  },
  { timestamps: true }
);

module.exports = mongoose.model('GateEntry', GateEntrySchema);
