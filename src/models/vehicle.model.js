const mongoose = require('mongoose');

const VehicleDocumentSchema = new mongoose.Schema({
  name: { type: String },
  url: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const VehicleSchema = new mongoose.Schema({
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
  vehicleNumber: { type: String, required: true, unique: false },
  vehicleType: { type: String, enum: ['2 Wheeler', '3 Wheeler', '4 Wheeler', '6 Wheeler'], required: true },

  ...require('./default-fields.model')
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
