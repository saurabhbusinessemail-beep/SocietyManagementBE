const mongoose = require('mongoose');

const SocietyRoleMenuSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },

    menus: [
      {
        menuId: { type: String, required: true },
        sortOrder: { type: Number, required: true }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocietyRoleMenu', SocietyRoleMenuSchema);
