const mongoose = require('mongoose');

const FlatSchema = new mongoose.Schema({
  flatNumber: { type: String, required: true }, // e.g. 'A-101'
  buildingId: { type: mongoose.Types.ObjectId, ref: 'Building' },
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatType: { type: String, enum: ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK', '6BHK'] },
  floor: { type: Number },

  residingType: { type: String, enum: ['Self', 'Tenant', 'Vacant'], default: 'Vacant' },
  isMultiTenantAllowed: { type: Boolean, default: false },
  meta: { type: mongoose.Schema.Types.Mixed },

  ...require('./default-fields.model')
}, { timestamps: true });

// Ref fields used in populate / joins
FlatSchema.index({ societyId: 1 });
FlatSchema.index({ buildingId: 1 });
// Compound: most common query pattern is societyId + buildingId
FlatSchema.index({ societyId: 1, buildingId: 1 });
// Enum field used for filtering
FlatSchema.index({ societyId: 1, residingType: 1 });
FlatSchema.index({ societyId: 1, flatType: 1 });

module.exports = mongoose.model('Flat', FlatSchema);
