const mongoose = require('mongoose');

const FlatSchema = new mongoose.Schema({
  flatNumber: { type: String, required: true }, // e.g. 'A-101'
  buildingId: { type: String },
  societyId: { type: String },
  flatType: { type: String, enum: ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK', '6BHK'] },
  floor: { type: Number },

  // status: owner / rented / vacant
  residingType: { type: String, enum: ['Self', 'Tenant', 'Vacant'], default: 'Self' },

  // owner and members stored as string ids
  ownerId: { type: String },
  memberIds: [{ type: String }], // flat members (owners & family)
  tenantId: { type: String }, // current tenant if any

  parkingIds: [{ type: String }],
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Flat', FlatSchema);
