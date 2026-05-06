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

    managerId: { type: mongoose.Types.ObjectId, ref: 'User' },

    ...require('./default-fields.model')
  },
  { timestamps: true }
);

// Primary filter for all queries
BuildingSchema.index({ societyId: 1 });
// Used in chat service to check building manager access
BuildingSchema.index({ societyId: 1, managerId: 1 });
BuildingSchema.index({ managerId: 1 });

module.exports = mongoose.model('Building', BuildingSchema);
