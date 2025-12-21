const mongoose = require('mongoose');

const SocietyRoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. 'admin'
  displayName: { type: String },
  description: { type: String },
  permissions: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('SocietyRole', SocietyRoleSchema);
