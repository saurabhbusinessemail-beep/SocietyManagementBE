// scripts/seedMenus.js
const { Menu } = require('../models');

const menus = [
  {
    menuId: 'society',
    menuName: 'Societies',
    icon: 'society-icon',
    relativePath: '/society/list'
  },
  {
    menuId: 'myflats',
    menuName: 'My Flats',
    icon: 'home',
    relativePath: '/myflats'
  },
  {
    menuId: 'visitors',
    menuName: 'Visitors',
    icon: 'visitor',
    relativePath: '/visitors'
  },
  {
    menuId: 'complaints',
    menuName: 'Complaints',
    icon: 'complaint',
    relativePath: '/complaints'
  },
  {
    menuId: 'tenants',
    menuName: 'Tenant Management',
    icon: 'supervisor_account',
    relativePath: '/abcd'
  },
  {
    menuId: 'members',
    menuName: 'Users & Members',
    icon: 'person',
    relativePath: '/abcd'
  },
  {
    menuId: 'announcements',
    menuName: 'Announcements',
    icon: 'campaign'
  },
  {
    menuId: 'gateentry', // for security
    menuName: 'Gate Entry',
    icon: 'gateentry',
    relativePath: '/gateentry/dashboard'
  },
  {
    menuId: 'gatepass',
    menuName: 'Gate Pass',
    icon: 'gatepass',
    relativePath: '/gatepass'
  }
];

async function seedMenus() {
  for (let menu of menus) {
    const exists = await Menu.findOne({ menuId: menu.menuId });
    if (!exists) {
      await Menu.create(menu);
      console.log(`✔ Menu created: ${menu.menuId}`);
    } else {
      if (exists.menuName !== menu.menuName || exists.icon !== menu.icon || exists.relativePath !== menu.relativePath) {
        await Menu.findByIdAndUpdate(exists._id, menu);
        console.log(`✔ Menu updated: ${menu.menuId}`);
      } else console.log(`✔ Menu exists: ${menu.menuId}`);
    }
  }
}

module.exports = seedMenus;
