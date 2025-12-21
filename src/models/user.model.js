const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // plain id stored by mongo will still be _id, but any referenced ids (societyId etc.) are strings
  name: { type: String },
  email: { type: String },
  phoneNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'blocked'], default: 'active' },
  profilePic: { type: String },

  // multiple roles or role mappings stored as strings or small sub-docs
  role: { type: String, enum: ['admin', 'user'], default: 'user' }, // e.g. 'admin','manager'

  // optional meta
  lastLoginAt: { type: Date },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
