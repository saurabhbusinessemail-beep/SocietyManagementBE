// scripts/seedRoleMenus.js
const SocietyRoleMenu = require("../models/societyRoleMenu.model");

const roleMenus = [
  {
    role: "societyadmin",
    menus: [
      { menuId: "society", sortOrder: 1 },
      { menuId: "complaints", sortOrder: 2 },
      { menuId: "announcements", sortOrder: 3 }
    ]
  },

  /* -------------------------- MANAGER -------------------------- */
  {
    role: "manager",
    menus: [
      { menuId: "society", sortOrder: 1 },
      { menuId: "complaints", sortOrder: 2 },
      { menuId: "announcements", sortOrder: 3 }
    ]
  },

  /* -------------------------- OWNER -------------------------- */
  {
    role: "owner",
    menus: [
      { menuId: "society", sortOrder: 1 },
      { menuId: "visitors", sortOrder: 2 },
      { menuId: "complaints", sortOrder: 3 },
      { menuId: "tenants", sortOrder: 4 },
      { menuId: "members", sortOrder: 5 },
      { menuId: "announcements", sortOrder: 6 },
    ]
  },

  /* -------------------------- TENANT -------------------------- */
  {
    role: "tenant",
    menus: [
      { menuId: "society", sortOrder: 1 },
      { menuId: "visitors", sortOrder: 2 },
      { menuId: "complaints", sortOrder: 3 },
      { menuId: "tenants", sortOrder: 4 },
      { menuId: "members", sortOrder: 5 },
      { menuId: "announcements", sortOrder: 6 },
    ]
  },

  /* -------------------------- SECURITY -------------------------- */
  {
    role: "security",
    menus: [
      { menuId: "gateentry", sortOrder: 1 },
      { menuId: "society", sortOrder: 2 },
    ]
  }
];

async function seedRoleMenus() {
  for (let rm of roleMenus) {
    const exists = await RoleMenu.findOne({ role: rm.role });
    if (!exists) {
      await SocietyRoleMenu.create(rm);
      console.log(`✔ Created role-menu mapping: ${rm.role}`);
    } else {
      // update if needed
      await SocietyRoleMenu.updateOne({ role: rm.role }, { $set: { menus: rm.menus } });
      console.log(`✔ Updated role-menu mapping: ${rm.role}`);
    }
  }
}

module.exports = seedRoleMenus;
