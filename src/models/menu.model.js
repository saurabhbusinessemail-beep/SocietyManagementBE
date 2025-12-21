const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema({
  menuId: { type: String, required: true, unique: true },
  menuName: { type: String, required: true },
  icon: { type: String },
  relativePath: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Menu", MenuSchema);
