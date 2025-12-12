const mongoose = require('mongoose');

const GatePassHistorySchema = new mongoose.Schema({
  changedBy: { type: String }, // user id string
  changedAt: { type: Date, default: Date.now },
  fromStatus: { type: String },
  toStatus: { type: String },
  note: { type: String }
}, { _id: false });

const GatePassSchema = new mongoose.Schema({
  gatePassId: { type: String, unique: true }, // optional external id
  flatId: { type: String },
  visitorName: { type: String, required: true },
  visitorContact: { type: String },
  purpose: { type: String },
  vehicleNumber: { type: String },
  expectedIn: { type: Date },
  expectedOut: { type: Date },
  status: { type: String, enum: ['requested', 'approved', 'rejected', 'cancelled', 'expired', 'completed'], default: 'requested' },
  createdBy: { type: String }, // who created the pass
  approvedBy: { type: String },
  history: [GatePassHistorySchema],
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('GatePass', GatePassSchema);
