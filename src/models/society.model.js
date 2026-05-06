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
    societyName: { type: String, required: true, unique: true },
    gpsLocation: { type: GpsLocationSchema },
    numberOfBuildings: { type: Number },
    numberOfFlats: { type: Number },

    // Approved / UnApproved Status
    isApproved: { type: Boolean },
    isRejected: { type: Boolean },
    addedByAdmin: { type: Boolean },

    // governance / contact
    adminContacts: [{ type: mongoose.Types.ObjectId, ref: 'User', required: true }],

    // settings or preferences for the society
    settings: { type: mongoose.Schema.Types.Mixed },

    // lists of related ids kept as strings
    managerIds: [{ type: mongoose.Types.ObjectId, ref: 'User', required: true }],

    ...require('./default-fields.model')
  },
  { timestamps: true }
);

// Approval-status filter used in admin dashboards
SocietySchema.index({ isApproved: 1 });
SocietySchema.index({ isRejected: 1 });
// adminContacts ref — used in society access checks
SocietySchema.index({ adminContacts: 1 });

module.exports = mongoose.model('Society', SocietySchema);
