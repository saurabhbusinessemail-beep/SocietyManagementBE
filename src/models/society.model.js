const mongoose = require('mongoose');

const GpsLocationSchema = new mongoose.Schema(
  {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    source: { type: String }
  },
  { _id: false }
);

const SocietySchema = new mongoose.Schema(
  {
    societyName: { type: String, required: true },
    gpsLocation: { type: GpsLocationSchema },
    numberOfBuildings: { type: Number },

    // governance / contact
    adminContact: { type: String },
    contactEmail: { type: String },

    // settings or preferences for the society
    settings: { type: mongoose.Schema.Types.Mixed },

    // lists of related ids kept as strings
    buildingIds: [{ type: String }],
    flatIds: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Society', SocietySchema);
