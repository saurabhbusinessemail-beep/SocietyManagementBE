const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. 'admin'
  displayName: { type: String },
  description: { type: String },
  permissions: [{ type: String }] // list of permission keys: ['read:users','manage:vehicles']
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
