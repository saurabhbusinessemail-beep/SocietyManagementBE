const mongoose = require('mongoose');

const FlatMemberSchema = new mongoose.Schema({
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },

  name: { type: String, required: true },
  contact: { type: String, required: true },
  // status: owner / rented / vacant
  residingType: { type: String, enum: ['Self', 'Tenant', 'Vacant'], default: 'Self' },

  isOwner: { type: Boolean, default: false },
  isTenant: { type: Boolean, default: false },

  // For Tenants specially
  leaseStart: { type: Date },
  leaseEnd: { type: Date },
  rentAmount: { type: Number },
  documents: [{ type: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' },

  ...require('./default-fields.model')
}, { timestamps: true });

module.exports = mongoose.model('FlatMember', FlatMemberSchema);
