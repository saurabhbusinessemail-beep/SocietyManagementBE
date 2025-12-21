const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema(
  {
    buildingNumber: { type: String, required: true }, // e.g. 'A Block'
    societyId: {
      type: mongoose.Types.ObjectId,
      ref: 'Society',
      required: true
    },
    floors: { type: Number, default: 0 },

    // optional map of floor -> flats
    // floorMap: { type: mongoose.Schema.Types.Mixed },

    secreataryId: { type: mongoose.Types.ObjectId, ref: 'User' },

    ...require('./default-fields.model')
  },
  { timestamps: true }
);

module.exports = mongoose.model('Building', BuildingSchema);
