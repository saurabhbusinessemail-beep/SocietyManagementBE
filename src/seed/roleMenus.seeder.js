// scripts/seedRoleMenus.js
const { SocietyRoleMenu } = require('../models');

const menuOrders = {
  society: 1,
  myflats: 2,
  chat: 3,
  visitors: 4,
  gateentry: 5,
  gatepass: 6,
  vehicle: 7,
  announcements: 8,
  complaints: 9,
  members: 10,
  tenants: 11,
  unApprovedSocieties: 12
};

const roleMenus = [
  {
    role: 'societyadmin',
    menus: [
      { menuId: 'society', sortOrder: menuOrders.society },
      { menuId: 'chat', sortOrder: menuOrders.chat },
      { menuId: 'announcements', sortOrder: menuOrders.announcements },
      { menuId: 'complaints', sortOrder: menuOrders.complaints },
      { menuId: 'unApprovedSocieties', sortOrder: menuOrders.unApprovedSocieties }
    ]
  },

  /* -------------------------- MANAGER -------------------------- */
  {
    role: 'manager',
    menus: [
      { menuId: 'society', sortOrder: menuOrders.society },
      { menuId: 'chat', sortOrder: menuOrders.chat },
      { menuId: 'announcements', sortOrder: menuOrders.announcements },
      { menuId: 'complaints', sortOrder: menuOrders.complaints },
      { menuId: 'unApprovedSocieties', sortOrder: menuOrders.unApprovedSocieties }
    ]
  },

  /* -------------------------- OWNER -------------------------- */
  {
    role: 'owner',
    menus: [
      { menuId: 'myflats', sortOrder: menuOrders.myflats },
      { menuId: 'chat', sortOrder: menuOrders.chat },
      { menuId: 'visitors', sortOrder: menuOrders.visitors },
      { menuId: 'gatepass', sortOrder: menuOrders.gatepass },
      { menuId: 'vehicle', sortOrder: menuOrders.vehicle },
      { menuId: 'announcements', sortOrder: menuOrders.announcements },
      { menuId: 'complaints', sortOrder: menuOrders.complaints },
      { menuId: 'members', sortOrder: menuOrders.members },
      { menuId: 'tenants', sortOrder: menuOrders.tenants },
      { menuId: 'unApprovedSocieties', sortOrder: menuOrders.unApprovedSocieties }
    ]
  },

  /* -------------------------- TENANT -------------------------- */
  {
    role: 'tenant',
    menus: [
      { menuId: 'myflats', sortOrder: menuOrders.myflats },
      { menuId: 'chat', sortOrder: menuOrders.chat },
      { menuId: 'visitors', sortOrder: menuOrders.visitors },
      { menuId: 'gatepass', sortOrder: menuOrders.gatepass },
      { menuId: 'vehicle', sortOrder: menuOrders.vehicle },
      { menuId: 'announcements', sortOrder: menuOrders.announcements },
      { menuId: 'complaints', sortOrder: menuOrders.complaints },
      { menuId: 'members', sortOrder: menuOrders.members },
      { menuId: 'unApprovedSocieties', sortOrder: menuOrders.unApprovedSocieties }
    ]
  },

  /* -------------------------- MEMBER -------------------------- */
  {
    role: 'member',
    menus: [
      { menuId: 'myflats', sortOrder: menuOrders.myflats },
      { menuId: 'chat', sortOrder: menuOrders.chat },
      { menuId: 'visitors', sortOrder: menuOrders.visitors },
      { menuId: 'gatepass', sortOrder: menuOrders.gatepass },
      { menuId: 'vehicle', sortOrder: menuOrders.vehicle },
      { menuId: 'announcements', sortOrder: menuOrders.announcements },
      { menuId: 'complaints', sortOrder: menuOrders.complaints },
      { menuId: 'members', sortOrder: menuOrders.members },
      { menuId: 'unApprovedSocieties', sortOrder: menuOrders.unApprovedSocieties }
    ]
  },

  /* -------------------------- SECURITY -------------------------- */
  {
    role: 'security',
    menus: [
      { menuId: 'society', sortOrder: menuOrders.society },
      { menuId: 'gateentry', sortOrder: menuOrders.gateentry },
      { menuId: 'chat', sortOrder: menuOrders.chat },
      { menuId: 'unApprovedSocieties', sortOrder: menuOrders.unApprovedSocieties }
    ]
  }
];

async function seedRoleMenus() {
  for (let rm of roleMenus) {
    const exists = await SocietyRoleMenu.findOne({ role: rm.role });
    if (!exists) {
      await SocietyRoleMenu.create(rm);
      console.log(`✔ Created role-menu mapping: ${rm.role}`);
    } else {
      // update if needed
      await SocietyRoleMenu.updateOne(
        { role: rm.role },
        { $set: { menus: rm.menus } }
      );
      console.log(`✔ Updated role-menu mapping: ${rm.role}`);
    }
  }
}

module.exports = seedRoleMenus;
