const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  menuId: { type: String, required: true, unique: true },
  menuName: { type: String, required: true },
  icon: { type: String },
  relativePath: { type: String },
  mandatorFeatureAccess: { type: String },
  loadWithoutSociety: { type: Boolean }
}, { timestamps: true });

module.exports = mongoose.model("Menu", MenuSchema);
