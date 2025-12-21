const { SocietyRole } = require('../models');

function createPerms(moduleName, permissions) {
  return permissions.split(', ').map(p => {
    return moduleName + '.' + p;
  });
}

const defaultRoles = [
  {
    name: 'societyadmin',
    displayName: 'Society Admin',
    description: 'Full society system access',
    permissions: [
      ...createPerms('society', 'view, update, adminContact.view'),
      ...createPerms('manager', 'view, add, update, delete'),
      ...createPerms('building', 'view, add, update, delete'),
      ...createPerms('flat', 'view, add, update, delete, link.approve, link.reject'),
      ...createPerms('parking', 'view, add, update, delete'),
      ...createPerms('owner', 'view, approve'),
      ...createPerms('tenant', 'view'),
      ...createPerms('security', 'view'),
      ...createPerms('complaint', 'view, approve, reject'),
    ]
  },
  {
    name: 'manager',
    displayName: 'Society Manager',
    description:
      'Can manage society, buildings, flats, parkings, complaints, gate passes',
    permissions: [
      ...createPerms('society', 'view, update, adminContact.view'),
      ...createPerms('manager', 'view'),
      ...createPerms('building', 'view, add, update, delete'),
      ...createPerms('flat', 'view, add, update, delete, link.approve, link.reject'),
      ...createPerms('parking', 'view, add, update, delete'),
      ...createPerms('vehicle', 'view'),
      ...createPerms('owner', 'view, add, approve'),
      ...createPerms('tenant', 'view'),
      ...createPerms('security', 'view, add, update, delete'),
      ...createPerms('complaint', 'view, approve, reject'),
      ...createPerms('gatepass', 'view, add, update, delete, approve, reject, cancel'),
    ]
  },
  {
    name: 'owner',
    displayName: 'Flat Owner',
    description: 'Owner of a flat',
    permissions: [
      ...createPerms('society', 'view, adminContact.view'),
      ...createPerms('manager', 'view'),
      ...createPerms('building', 'view'),
      ...createPerms('flat', 'view'),
      ...createPerms('parking', 'view, link'),
      ...createPerms('vehicle', 'view, add, update, delete, link'),
      ...createPerms('member', 'view, add, update, delete'),
      ...createPerms('tenant', 'view, add, update, delete'),
      ...createPerms('complaint', 'view, add, update, delete'),
      ...createPerms('gatepass', 'view, add, update, delete, approve, reject, cancel'),

    ]
  },
  {
    name: 'member',
    displayName: 'Flat Owner',
    description: 'Owner of a flat',
    permissions: [
      ...createPerms('society', 'view, adminContact.view'),
      ...createPerms('manager', 'view'),
      ...createPerms('building', 'view'),
      ...createPerms('flat', 'view'),
      ...createPerms('parking', 'view, link'),
      ...createPerms('vehicle', 'view, add, update, delete, link'),
      ...createPerms('complaint', 'view, add, update, delete'),
      ...createPerms('gatepass', 'view, add, update, delete, approve, reject, cancel'),

    ]
  },
  {
    name: 'tenant',
    displayName: 'Tenant',
    description: 'Tenant of a flat',
    permissions: [
      ...createPerms('society', 'view, adminContact.view'),
      ...createPerms('manager', 'view'),
      ...createPerms('building', 'view'),
      ...createPerms('flat', 'view'),
      ...createPerms('tenant', 'view, add, update, delete'),
      ...createPerms('complaint', 'view, add, update, delete'),
      ...createPerms('gatepass', 'view, add, update, delete, approve, reject, cancel'),
    ]
  },
  {
    name: 'security',
    displayName: 'Security Guard',
    description: 'Gate security operations',
    permissions: [
      ...createPerms('society', 'view, adminContact.view'),
      ...createPerms('manager', 'view'),
      ...createPerms('building', 'view'),
      ...createPerms('gatepass', 'view, add, update, delete, approve, reject, cancel'),
    ]
  }
];

async function seedRoles() {
  try {
    for (let role of defaultRoles) {
      const exists = await SocietyRole.findOne({ name: role.name });

      if (!exists) {
        await SocietyRole.create(role);
        console.log(`✔ Role created: ${role.name}`);
      } else {
        console.log(`✔ Role already exists: ${role.name}`);
      }
    }
  } catch (err) {
    console.error('❌ Error seeding roles:', err);
  }
}

module.exports = seedRoles;
