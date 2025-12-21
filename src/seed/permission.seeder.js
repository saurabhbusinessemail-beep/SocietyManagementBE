const Permission = require("../models/permission.model");

// ACTIONS per module
const CRUD_ACTIONS = ["view", "add", "update", "delete"];

// Additional actions for specific modules
const EXTRA_ACTIONS = {
  society: ['adminContact.view', 'adminContact.update', 'adminContact.add', 'adminContact.delete'],
  flat: ['link.approve', 'link.reject'],
  parking: ['link'],
  complaint: ["approve", "resolve", "reject", "reopen", "cancel"],
  gatepass: ["approve", "reject", "cancel"],
  member: [],
  tenant: [],
  vehicle: ['link'],
  owner: ['approve'],
  visitor: [],
  user: [],
  permission:[],
  role: [],
};

const MODULES = [
  "society",
  "secretary",
  "building",
  "flat",
  "parking",
  "vehicle",
  "owner",
  "member",
  "tenant",
  "security",
  "complaint",
  "gatepass",
  "feature",
  "user",
  "permission",
  "role"
];

function buildPermissions() {
  const result = [];

  MODULES.forEach(module => {
    // Basic CRUD-like actions
    CRUD_ACTIONS.forEach(action => {
      result.push({
        key: `${module}.${action}`,
        module,
        action,
        description: `${action} ${module}`
      });
    });

    // Extra actions for certain modules
    if (EXTRA_ACTIONS[module]) {
      EXTRA_ACTIONS[module].forEach(action => {
        result.push({
          key: `${module}.${action}`,
          module,
          action,
          description: `${action} ${module}`
        });
      });
    }
  });

  return result;
}

const defaultPermissions = buildPermissions();

async function seedPermissions() {
  try {
    for (let perm of defaultPermissions) {
      const exists = await Permission.findOne({ key: perm.key });

      if (!exists) {
        await Permission.create(perm);
        console.log(`✔ Permission created: ${perm.key}`);
      } else {
        console.log(`✔ Exists: ${perm.key}`);
      }
    }
  } catch (err) {
    console.error("❌ Error seeding permissions:", err);
  }
}

module.exports = seedPermissions;
