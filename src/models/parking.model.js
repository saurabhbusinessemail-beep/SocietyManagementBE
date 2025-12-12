const mongoose = require('mongoose');

const ParkingSchema = new mongoose.Schema({
  parkingId: { type: String, unique: true },
  societyId: { type: String },
  buildingId: { type: String },
  slotNumber: { type: String, required: true },
  level: { type: String },
  isReserved: { type: Boolean, default: false },
  reservedForFlatId: { type: String },
  vehicleId: { type: String }, // current parked vehicle (string)
  type: { type: String, enum: ['twoWheeler', 'fourWheeler', 'compact', 'large', 'disabled'], default: 'fourWheeler' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Parking', ParkingSchema);
