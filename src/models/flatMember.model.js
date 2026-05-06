const mongoose = require('mongoose');

const FlatMemberSchema = new mongoose.Schema({
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },

  name: { type: String, required: true },
  contact: { type: String, required: true },
  // status: owner / rented / vacant

  isOwner: { type: Boolean, default: false },
  isTenant: { type: Boolean, default: false },
  isMember: { type: Boolean, default: false },
  isTenantMember: { type: Boolean, default: false },

  // For Tenants specially
  leaseStart: { type: Date },
  leaseEnd: { type: Date },
  rentAmount: { type: Number },
  documents: [{ type: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' },

  ...require('./default-fields.model')
}, { timestamps: true });

// Core lookup: find all memberships for a user within a society
FlatMemberSchema.index({ userId: 1, societyId: 1 });
// Core lookup: find all members of a flat
FlatMemberSchema.index({ flatId: 1, societyId: 1 });
// Role-based filtering used in chat service and notifications
FlatMemberSchema.index({ societyId: 1, isOwner: 1 });
FlatMemberSchema.index({ societyId: 1, isTenant: 1 });
// Status filtering (active vs terminated/expired)
FlatMemberSchema.index({ societyId: 1, status: 1 });
FlatMemberSchema.index({ flatId: 1, isDeleted: 1 });

module.exports = mongoose.model('FlatMember', FlatMemberSchema);
