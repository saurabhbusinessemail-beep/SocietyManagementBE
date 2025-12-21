const mongoose = require('mongoose');

const SocietyRoleMenuSchema = new mongoose.Schema(
  {
    role: { type: mongoose.Types.ObjectId, ref: 'SocietyRole', required: true },

    menus: [
      {
        menuId: { type: mongoose.Types.ObjectId, ref: 'Menu', required: true },
        sortOrder: { type: Number, required: true }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocietyRoleMenu', SocietyRoleMenuSchema);
