const { Role } = require("../models");

const defaultRoles = [
    // ===========================================================
    // ADMIN — Full system access
    // ===========================================================
    {
      name: "admin",
      displayName: "Administrator",
      description: "Full system access",
      permissions: ["*"] // admin gets ALL permissions
    },
  
    // ===========================================================
    // SOCIETY MANAGER — manages society, buildings, flats, parking, complaints, gatepass
    // ===========================================================
    {
      name: "manager",
      displayName: "Society Manager",
      description: "Can manage society, buildings, flats, parkings, complaints, gate passes",
      permissions: [
        // Society
        "society.view", "society.add", "society.update", "society.manage",
  
        // Building
        "building.view", "building.add", "building.update", "building.delete", "building.manage",
  
        // Flats
        "flat.view", "flat.add", "flat.update", "flat.delete", "flat.manage",
  
        // Parking
        "parking.view", "parking.add", "parking.update", "parking.delete", "parking.manage",
  
        // Features (optional)
        "feature.view", "feature.add", "feature.update", "feature.delete", "feature.manage",
  
        // Complaints
        "complaint.view", "complaint.update", "complaint.manage",
        "complaint.approve", "complaint.resolve", "complaint.reject",
  
        // Gatepass
        "gatepass.view", "gatepass.add", "gatepass.update", "gatepass.delete", "gatepass.manage",
        "gatepass.approve", "gatepass.reject", "gatepass.cancel",
  
        // Temporary Gatepass
        "tempGatepass.view", "tempGatepass.add", "tempGatepass.update", "tempGatepass.delete",
        "tempGatepass.manage", "tempGatepass.approve", "tempGatepass.reject", "tempGatepass.cancel",
  
        // Vehicles
        "vehicle.view", "vehicle.manage",
  
        // Members
        "member.view", "member.manage",
  
        // Tenants
        "tenant.view", "tenant.manage",
  
        // Visitors
        "visitor.view", "visitor.manage",
  
        // Gate Entry
        "gateentry.view", "gateentry.manage"
      ]
    },
  
    // ===========================================================
    // OWNER — owner of a flat, manage own flat data, family, vehicles, complaints
    // ===========================================================
    {
      name: "owner",
      displayName: "Flat Owner",
      description: "Owner of a flat",
      permissions: [
        // Flats (OWN ONLY)
        "flat.view", "flat.update",
  
        // Members
        "member.view", "member.add", "member.update", "member.delete",
  
        // Vehicles
        "vehicle.view", "vehicle.add", "vehicle.update", "vehicle.delete",
  
        // Complaints
        "complaint.view", "complaint.add", "complaint.update",
        "complaint.reopen", "complaint.cancel"
      ]
    },
  
    // ===========================================================
    // TENANT — manages own members & vehicles, raise complaints
    // ===========================================================
    {
      name: "tenant",
      displayName: "Tenant",
      description: "Tenant of a flat",
      permissions: [
        // Members
        "member.view", "member.add", "member.update", "member.delete",
  
        // Vehicles
        "vehicle.view", "vehicle.add", "vehicle.update", "vehicle.delete",
  
        // Complaints
        "complaint.view", "complaint.add", "complaint.update",
        "complaint.reopen", "complaint.cancel"
      ]
    },
  
    // ===========================================================
    // SECURITY GUARD — manages gate entry, approve/reject gatepass
    // ===========================================================
    {
      name: "security",
      displayName: "Security Guard",
      description: "Gate security operations",
      permissions: [
        // Gate Entry
        "gateentry.view", "gateentry.add", "gateentry.manage",
  
        // Gatepass
        "gatepass.view", "gatepass.update", "gatepass.manage",
        "gatepass.approve", "gatepass.reject", "gatepass.cancel",
  
        // Visitor
        "visitor.view", "visitor.add"
      ]
    }
  ];
  

async function seedRoles() {
  try {
    for (let role of defaultRoles) {
      const exists = await Role.findOne({ name: role.name });

      if (!exists) {
        await Role.create(role);
        console.log(`✔ Role created: ${role.name}`);
      } else {
        console.log(`✔ Role already exists: ${role.name}`);
      }
    }
  } catch (err) {
    console.error("❌ Error seeding roles:", err);
  }
}

module.exports = seedRoles;
