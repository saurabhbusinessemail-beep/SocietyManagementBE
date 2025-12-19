const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  buildingNumber: { type: String, required: true }, // e.g. 'A Block'
  societyId: { type: String, required: true },
  floors: { type: Number, default: 0 },
  totalFlats: { type: Number, default: 0 },

  // optional map of floor -> flats
  // floorMap: { type: mongoose.Schema.Types.Mixed },

  secreataryId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Building', BuildingSchema);
