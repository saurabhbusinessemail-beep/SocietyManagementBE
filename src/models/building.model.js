const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. 'A Block'
  code: { type: String },
  societyId: { type: String, required: true },
  address: { type: String },
  floors: { type: Number, default: 0 },
  totalFlats: { type: Number, default: 0 },

  // optional map of floor -> flats
  floorMap: { type: mongoose.Schema.Types.Mixed },

  managerId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Building', BuildingSchema);
