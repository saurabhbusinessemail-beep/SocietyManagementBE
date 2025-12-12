const mongoose = require("mongoose");

const SubMenuSchema = new mongoose.Schema({
  submenuId: { type: String, required: true },
  submenuName: { type: String, required: true },
  relativePath: { type: String, required: true },
  permissions: [{ type: String }]  // use only existing permission keys
});

const MenuSchema = new mongoose.Schema({
  menuId: { type: String, required: true, unique: true },
  menuName: { type: String, required: true },
  icon: { type: String },
  relativePath: { type: String },
  submenus: [SubMenuSchema]
}, { timestamps: true });

module.exports = mongoose.model("Menu", MenuSchema);
