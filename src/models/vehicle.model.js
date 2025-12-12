const mongoose = require('mongoose');

const VehicleDocumentSchema = new mongoose.Schema({
  name: { type: String },
  url: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const VehicleSchema = new mongoose.Schema({
  ownerId: { type: String }, // user id or flat owner id as string
  flatId: { type: String },
  societyId: { type: String },
  registrationNumber: { type: String, required: true, unique: false },
  vehicleType: { type: String, enum: ['twoWheeler', 'fourWheeler', 'others'], default: 'twoWheeler' },
  make: { type: String },
  model: { type: String },
  color: { type: String },
  parkingSlotId: { type: String },
  isActive: { type: Boolean, default: true },
  documents: [VehicleDocumentSchema],
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
