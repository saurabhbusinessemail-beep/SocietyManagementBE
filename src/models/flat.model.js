const mongoose = require('mongoose');

const FlatSchema = new mongoose.Schema({
  flatNumber: { type: String, required: true }, // e.g. 'A-101'
  buildingId: { type: String, required: true },
  societyId: { type: String },
  floor: { type: Number },
  wing: { type: String },
  areaSqFt: { type: Number },

  // status: owner / rented / vacant
  status: { type: String, enum: ['Self', 'Tenant', 'Vacant'], default: 'Self' },

  // owner and members stored as string ids
  ownerId: { type: String },
  memberIds: [{ type: String }], // flat members (owners & family)
  tenantId: { type: String }, // current tenant if any

  parkingIds: [{ type: String }],
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Flat', FlatSchema);
