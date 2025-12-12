const mongoose = require("mongoose");

const RoleMenuSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ["admin", "manager", "owner", "tenant", "security"]
  },

  menus: [{
    menuId: { type: String, required: true },
    submenus: [{ type: String }]  // list of submenuIds
  }]
}, { timestamps: true });

module.exports = mongoose.model("RoleMenu", RoleMenuSchema);
