const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  flatId: { type: String, required: true },
  userId: { type: String }, // optional link to a user
  name: { type: String, required: true },
  contactNumber: { type: String },
  leaseStart: { type: Date },
  leaseEnd: { type: Date },
  rentAmount: { type: Number },
  documents: [{ type: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', TenantSchema);
