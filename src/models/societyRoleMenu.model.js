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

// Role lookup used in menu service (/me flow)
SocietyRoleMenuSchema.index({ role: 1 });

module.exports = mongoose.model('SocietyRoleMenu', SocietyRoleMenuSchema);
