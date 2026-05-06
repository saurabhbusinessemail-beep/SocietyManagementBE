const mongoose = require('mongoose');

const VehicleDocumentSchema = new mongoose.Schema({
  name: { type: String },
  url: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const VehicleSchema = new mongoose.Schema({
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
  vehicleNumber: { type: String, required: true, unique: false },
  vehicleType: { type: String, enum: ['2W', '3W', '4W', '6W'], required: true },

  ...require('./default-fields.model')
}, { timestamps: true });

// Flat-level vehicle lookup
VehicleSchema.index({ flatId: 1 });
// Vehicle type filter
VehicleSchema.index({ flatId: 1, vehicleType: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
