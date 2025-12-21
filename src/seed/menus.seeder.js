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
    menuId: 'visitors',
    menuName: 'Visitors',
    icon: 'people',
    relativePath: '/abcd'
  },
  {
    menuId: 'complaints',
    menuName: 'Complaints',
    icon: 'report_problem',
    relativePath: '/abcd'
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
    icon: 'input',
    relativePath: '/abcd'
  }
];

async function seedMenus() {
  for (let menu of menus) {
    const exists = await Menu.findOne({ menuId: menu.menuId });
    if (!exists) {
      await Menu.create(menu);
      console.log(`✔ Menu created: ${menu.menuId}`);
    } else {
      console.log(`✔ Menu exists: ${menu.menuId}`);
    }
  }
}

module.exports = seedMenus;
