const mongoose = require('mongoose');

const RoleMenuSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ['admin', 'manager', 'owner', 'tenant', 'security']
    },

    menus: [
      {
        menuId: { type: String, required: true },
        sortOrder: { type: Number, required: true },
        submenus: [
          {
            id: { type: String },
            sortOrder: { type: Number, required: true }
          }
        ] // list of submenuIds
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoleMenu', RoleMenuSchema);
