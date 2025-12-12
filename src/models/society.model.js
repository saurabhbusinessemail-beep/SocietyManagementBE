const mongoose = require('mongoose');

const SocietySchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationNumber: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  pincode: { type: String },

  // governance / contact
  adminContact: { type: String },
  contactEmail: { type: String },

  // settings or preferences for the society
  settings: { type: mongoose.Schema.Types.Mixed },

  // lists of related ids kept as strings
  buildingIds: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Society', SocietySchema);
