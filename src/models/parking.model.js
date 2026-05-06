const mongoose = require('mongoose');

const ParkingSchema = new mongoose.Schema({
  parkingNumber: { type: String, required: true },
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  buildingId: { type: mongoose.Types.ObjectId, ref: 'Building' },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat' },
  parkingType: { type: String, enum: ['2W', '3W', '4W', '6W'], default: '4W' },

  ...require('./default-fields.model')
}, { timestamps: true });

// Society-level parking list
ParkingSchema.index({ societyId: 1 });
// Flat assignment lookup
ParkingSchema.index({ societyId: 1, flatId: 1 });
// Building-level parking
ParkingSchema.index({ societyId: 1, buildingId: 1 });
// parkingType enum for type-based filtering
ParkingSchema.index({ societyId: 1, parkingType: 1 });

module.exports = mongoose.model('Parking', ParkingSchema);
