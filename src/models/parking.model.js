const mongoose = require('mongoose');

const ParkingSchema = new mongoose.Schema({
  parkingNumber: { type: String, required: true },
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  buildingId: { type: mongoose.Types.ObjectId, ref: 'Building' },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat' },
  parkingType: { type: String, enum: ['2W', '3W', '4W', '6W'], default: '4W' },

  ...require('./default-fields.model')
}, { timestamps: true });

module.exports = mongoose.model('Parking', ParkingSchema);
