const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },      // e.g. 'society.view'
  module: { type: String, required: true },                 // e.g. 'society'
  action: { type: String, required: true },                 // e.g. 'view'
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Permission", PermissionSchema);
