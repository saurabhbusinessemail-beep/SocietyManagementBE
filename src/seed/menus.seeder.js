// scripts/seedMenus.js
const { Menu } = require('../models');
import { FEATURES } from '../config/features';

const menus = [
  {
    menuId: 'society',
    menuName: 'Societies',
    icon: 'society-icon',
    relativePath: '/society/list',
  },
  {
    menuId: 'myflats',
    menuName: 'My Flats',
    icon: 'home',
    mandatorFeatureAccess: FEATURES.NUMBER_OF_FLATS,
    relativePath: '/myflats',
  },
  {
    menuId: 'visitors',
    menuName: 'Visitors',
    icon: 'visitor',
    mandatorFeatureAccess: FEATURES.VISITOR_MANAGEMENT,
    relativePath: '/visitors',
  },
  {
    menuId: 'complaints',
    menuName: 'Complaints',
    icon: 'complaint',
    mandatorFeatureAccess: FEATURES.COMPLAINTS,
    relativePath: '/complaints',
  },
  {
    menuId: 'tenants',
    menuName: 'Tenant Management',
    icon: 'tenant',
    mandatorFeatureAccess: FEATURES.TENANT_MANAGEMENT,
    relativePath: '/tenants',
  },
  {
    menuId: 'members',
    menuName: 'Members',
    icon: 'member',
    mandatorFeatureAccess: FEATURES.FLAT_MEMBER_MANAGEMENT,
    relativePath: '/members',
  },
  {
    menuId: 'announcements',
    menuName: 'Announcements',
    icon: 'announcement',
    mandatorFeatureAccess: FEATURES.ANNOUNCEMENTS,
    relativePath: '/announcements',
  },
  {
    menuId: 'gateentry', // for security
    menuName: 'Gate Entry',
    icon: 'gateentry',
    mandatorFeatureAccess: FEATURES.GATE_ENTRIES,
    relativePath: '/gateentry/dashboard',
  },
  {
    menuId: 'gatepass',
    menuName: 'Gate Pass',
    icon: 'gatepass',
    mandatorFeatureAccess: FEATURES.SMART_GATE_PASS,
    relativePath: '/gatepass',
  },
  {
    menuId: 'vehicle',
    menuName: 'Vehicles',
    icon: 'vehicle',
    mandatorFeatureAccess: FEATURES.VEHICLE,
    relativePath: '/vehicles',
  },
  {
    menuId: 'user',
    menuName: 'User',
    icon: 'account',
    onlyForSuperAdmin: true,
    relativePath: '/user',
  },
  {
    menuId: 'coupon',
    menuName: 'Coupons',
    icon: 'coupon',
    onlyForSuperAdmin: true,
    relativePath: '/coupons',
  },
  {
    menuId: 'unApprovedSocieties',
    menuName: 'Pending Approval',
    icon: 'approve-reject',
    relativePath: '/society/pendingApproval',
    loadWithoutSociety: true
  },
  {
    menuId: 'demo',
    menuName: 'Demo',
    icon: 'demo',
    relativePath: '/demo/list'
  },
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
