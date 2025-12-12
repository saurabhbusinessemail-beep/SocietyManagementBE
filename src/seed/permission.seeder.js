const Permission = require("../models/permission.model");

// ACTIONS per module
const CRUD_ACTIONS = ["view", "add", "update", "delete", "manage"];

// Additional actions for specific modules
const EXTRA_ACTIONS = {
  complaint: ["approve", "resolve", "reject", "reopen", "cancel"],
  gatepass: ["approve", "reject", "cancel"],
  tempGatepass: ["approve", "reject", "cancel"],
  member: [],
  tenant: [],
  vehicle: [],
  visitor: [],
  gateentry: [],
  user: [],
  permission:[],
  role: []
};

const MODULES = [
  "society",
  "building",
  "flat",
  "parking",
  "feature",
  "vehicle",
  "member",
  "tenant",
  "visitor",
  "complaint",
  "gatepass",
  "tempGatepass",
  "gateentry",
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
