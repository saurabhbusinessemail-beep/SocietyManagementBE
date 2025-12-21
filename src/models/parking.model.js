const mongoose = require('mongoose');

const ParkingSchema = new mongoose.Schema({
  parkingNumber: { type: String, required: true },
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat' },
  type: { type: String, enum: ['twoWheeler', 'fourWheeler', 'compact', 'large', 'disabled'], default: 'fourWheeler' },

  ...require('./default-fields.model')
}, { timestamps: true });

module.exports = mongoose.model('Parking', ParkingSchema);
