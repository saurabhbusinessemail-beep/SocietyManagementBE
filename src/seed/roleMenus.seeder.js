// scripts/seedRoleMenus.js
const RoleMenu = require("../models/roleMenu.model");

const roleMenus = [
  {
    role: "admin",
    menus: [
      { menuId: "dashboard_admin", sortOrder: 1, submenus: [] },

      { menuId: "society", sortOrder: 2, submenus: [
        { id: "society_list", sortOrder: 1 },
        { id: "society_add", sortOrder: 2 },
        { id: "society_edit", sortOrder: 3 },
        { id: "society_settings", sortOrder: 4 }
      ]},

      { menuId: "buildings", sortOrder: 3, submenus: [
        { id: "building_list", sortOrder: 1 },
        { id: "building_add", sortOrder: 2 },
        { id: "building_edit", sortOrder: 3 },
        { id: "floor_map", sortOrder: 4 }
      ]},

      { menuId: "flats", sortOrder: 4, submenus: [
        { id: "flat_list", sortOrder: 1 },
        { id: "flat_create", sortOrder: 2 },
        { id: "flat_assign_owner", sortOrder: 3 },
        { id: "flat_status", sortOrder: 4 }
      ]},

      { menuId: "parking", sortOrder: 5, submenus: [
        { id: "parking_slots", sortOrder: 1 },
        { id: "parking_assign", sortOrder: 2 },
        { id: "parking_rules", sortOrder: 3 }
      ]},

      { menuId: "vehicles", sortOrder: 6, submenus: [
        { id: "vehicle_list", sortOrder: 1 },
        { id: "vehicle_add", sortOrder: 2 },
        { id: "vehicle_entry_logs", sortOrder: 3 },
        { id: "vehicle_exit_logs", sortOrder: 4 },
        { id: "vehicle_manage", sortOrder: 5 }
      ]},

      { menuId: "gatepass", sortOrder: 7, submenus: [
        { id: "gatepass_list", sortOrder: 1 },
        { id: "gatepass_create", sortOrder: 2 },
        { id: "gatepass_approve", sortOrder: 3 },
        { id: "temp_gatepass", sortOrder: 4 }
      ]},

      { menuId: "visitors", sortOrder: 8, submenus: [
        { id: "visitor_list", sortOrder: 1 },
        { id: "visitor_add", sortOrder: 2 },
        { id: "visitor_logs", sortOrder: 3 }
      ]},

      { menuId: "complaints", sortOrder: 9, submenus: [
        { id: "complaints_list", sortOrder: 1 },
        { id: "complaint_create", sortOrder: 2 },
        { id: "complaint_manage", sortOrder: 3 },
        { id: "complaint_history", sortOrder: 4 }
      ]},

      { menuId: "family", sortOrder: 10, submenus: [
        { id: "family_list", sortOrder: 1 },
        { id: "family_add", sortOrder: 2 }
      ]},

      { menuId: "tenants", sortOrder: 11, submenus: [
        { id: "tenant_list", sortOrder: 1 },
        { id: "tenant_add", sortOrder: 2 }
      ]},

      { menuId: "members", sortOrder: 12, submenus: [
        { id: "user_list", sortOrder: 1 },
        { id: "user_add", sortOrder: 2 },
        { id: "roles_permissions", sortOrder: 3 }
      ]},

      { menuId: "features", sortOrder: 13, submenus: [
        { id: "feature_list", sortOrder: 1 },
        { id: "feature_configure", sortOrder: 2 },
        { id: "feature_pricing", sortOrder: 3 }
      ]},

      { menuId: "billing", sortOrder: 14, submenus: [
        { id: "billing_overview", sortOrder: 1 },
        { id: "invoices", sortOrder: 2 },
        { id: "payment_history", sortOrder: 3 }
      ]},

      { menuId: "announcements", sortOrder: 15, submenus: [
        { id: "notice_board", sortOrder: 1 },
        { id: "create_announcement", sortOrder: 2 }
      ]},

      { menuId: "documents", sortOrder: 16, submenus: [
        { id: "docs_list", sortOrder: 1 },
        { id: "docs_upload", sortOrder: 2 }
      ]},

      { menuId: "events", sortOrder: 17, submenus: [
        { id: "events_list", sortOrder: 1 },
        { id: "event_book", sortOrder: 2 }
      ]},

      { menuId: "number_plate", sortOrder: 18, submenus: [
        { id: "plate_list", sortOrder: 1 },
        { id: "plate_process", sortOrder: 2 }
      ]},

      { menuId: "local_manager", sortOrder: 19, submenus: [
        { id: "local_managers", sortOrder: 1 },
        { id: "local_manager_assign", sortOrder: 2 }
      ]},

      { menuId: "audit", sortOrder: 20, submenus: [
        { id: "audit_logs", sortOrder: 1 }
      ]},

      { menuId: "settings", sortOrder: 21, submenus: [
        { id: "app_settings", sortOrder: 1 }
      ]},

      { menuId: "gateentry", sortOrder: 22, submenus: [
        { id: "gate_entry", sortOrder: 1 },
        { id: "gate_scan", sortOrder: 2 }
      ]},

      { menuId: "guest", sortOrder: 23, submenus: [
        { id: "guest_list", sortOrder: 1 },
        { id: "guest_add", sortOrder: 2 }
      ]},

      { menuId: "reports", sortOrder: 24, submenus: [
        { id: "reports_overview", sortOrder: 1 },
        { id: "reports_export", sortOrder: 2 }
      ]},

      { menuId: "wifi_calling", sortOrder: 25, submenus: [
        { id: "wifi_status", sortOrder: 1 }
      ]}
    ]
  },

  /* -------------------------- MANAGER -------------------------- */
  {
    role: "manager",
    menus: [
      { menuId: "dashboard_manager", sortOrder: 1, submenus: [] },

      { menuId: "buildings", sortOrder: 2, submenus: [
        { id: "building_list", sortOrder: 1 },
        { id: "building_add", sortOrder: 2 },
        { id: "building_edit", sortOrder: 3 },
        { id: "floor_map", sortOrder: 4 }
      ]},

      { menuId: "flats", sortOrder: 3, submenus: [
        { id: "flat_list", sortOrder: 1 },
        { id: "flat_create", sortOrder: 2 },
        { id: "flat_assign_owner", sortOrder: 3 },
        { id: "flat_status", sortOrder: 4 }
      ]},

      { menuId: "parking", sortOrder: 4, submenus: [
        { id: "parking_slots", sortOrder: 1 },
        { id: "parking_assign", sortOrder: 2 }
      ]},

      { menuId: "vehicles", sortOrder: 5, submenus: [
        { id: "vehicle_list", sortOrder: 1 },
        { id: "vehicle_entry_logs", sortOrder: 2 },
        { id: "vehicle_exit_logs", sortOrder: 3 }
      ]},

      { menuId: "gatepass", sortOrder: 6, submenus: [
        { id: "gatepass_list", sortOrder: 1 },
        { id: "gatepass_approve", sortOrder: 2 },
        { id: "temp_gatepass", sortOrder: 3 }
      ]},

      { menuId: "visitors", sortOrder: 7, submenus: [
        { id: "visitor_list", sortOrder: 1 },
        { id: "visitor_logs", sortOrder: 2 }
      ]},

      { menuId: "complaints", sortOrder: 8, submenus: [
        { id: "complaints_list", sortOrder: 1 },
        { id: "complaint_manage", sortOrder: 2 },
        { id: "complaint_history", sortOrder: 3 }
      ]},

      { menuId: "family", sortOrder: 9, submenus: [
        { id: "family_list", sortOrder: 1 }
      ]},

      { menuId: "tenants", sortOrder: 10, submenus: [
        { id: "tenant_list", sortOrder: 1 },
        { id: "tenant_add", sortOrder: 2 }
      ]},

      { menuId: "features", sortOrder: 11, submenus: [
        { id: "feature_list", sortOrder: 1 },
        { id: "feature_configure", sortOrder: 2 }
      ]},

      { menuId: "announcements", sortOrder: 12, submenus: [
        { id: "notice_board", sortOrder: 1 },
        { id: "create_announcement", sortOrder: 2 }
      ]},

      { menuId: "documents", sortOrder: 13, submenus: [
        { id: "docs_list", sortOrder: 1 }
      ]},

      { menuId: "local_manager", sortOrder: 14, submenus: [
        { id: "local_managers", sortOrder: 1 }
      ]},

      { menuId: "reports", sortOrder: 15, submenus: [
        { id: "reports_overview", sortOrder: 1 }
      ]},

      { menuId: "gateentry", sortOrder: 16, submenus: [
        { id: "gate_entry", sortOrder: 1 },
        { id: "gate_scan", sortOrder: 2 }
      ]}
    ]
  },

  /* -------------------------- OWNER -------------------------- */
  {
    role: "owner",
    menus: [
      { menuId: "dashboard_owner", sortOrder: 1, submenus: [] },

      { menuId: "flats", sortOrder: 2, submenus: [
        { id: "flat_details", sortOrder: 1 }
      ]},

      { menuId: "family", sortOrder: 3, submenus: [
        { id: "family_list", sortOrder: 1 },
        { id: "family_add", sortOrder: 2 }
      ]},

      { menuId: "vehicles", sortOrder: 4, submenus: [
        { id: "vehicle_list", sortOrder: 1 },
        { id: "vehicle_add", sortOrder: 2 }
      ]},

      { menuId: "complaints", sortOrder: 5, submenus: [
        { id: "complaint_create", sortOrder: 1 },
        { id: "complaints_list", sortOrder: 2 },
        { id: "complaint_history", sortOrder: 3 }
      ]},

      { menuId: "gatepass", sortOrder: 6, submenus: [
        { id: "gatepass_create", sortOrder: 1 },
        { id: "gatepass_list", sortOrder: 2 }
      ]},

      { menuId: "visitors", sortOrder: 7, submenus: [
        { id: "visitor_list", sortOrder: 1 }
      ]},

      { menuId: "announcements", sortOrder: 8, submenus: [
        { id: "notice_board", sortOrder: 1 }
      ]},

      { menuId: "documents", sortOrder: 9, submenus: [
        { id: "docs_list", sortOrder: 1 }
      ]}
    ]
  },

  /* -------------------------- TENANT -------------------------- */
  {
    role: "tenant",
    menus: [
      { menuId: "dashboard_tenant", sortOrder: 1, submenus: [] },

      { menuId: "flats", sortOrder: 2, submenus: [
        { id: "flat_details", sortOrder: 1 }
      ]},

      { menuId: "family", sortOrder: 3, submenus: [
        { id: "family_list", sortOrder: 1 },
        { id: "family_add", sortOrder: 2 }
      ]},

      { menuId: "vehicles", sortOrder: 4, submenus: [
        { id: "vehicle_list", sortOrder: 1 },
        { id: "vehicle_add", sortOrder: 2 }
      ]},

      { menuId: "complaints", sortOrder: 5, submenus: [
        { id: "complaint_create", sortOrder: 1 },
        { id: "complaints_list", sortOrder: 2 }
      ]},

      { menuId: "gatepass", sortOrder: 6, submenus: [
        { id: "gatepass_create", sortOrder: 1 },
        { id: "gatepass_list", sortOrder: 2 }
      ]},

      { menuId: "announcements", sortOrder: 7, submenus: [
        { id: "notice_board", sortOrder: 1 }
      ]},

      { menuId: "documents", sortOrder: 8, submenus: [
        { id: "docs_list", sortOrder: 1 }
      ]}
    ]
  },

  /* -------------------------- SECURITY -------------------------- */
  {
    role: "security",
    menus: [
      { menuId: "dashboard_security", sortOrder: 1, submenus: [] },

      { menuId: "gateentry", sortOrder: 2, submenus: [
        { id: "gate_entry", sortOrder: 1 },
        { id: "gate_scan", sortOrder: 2 }
      ]},

      { menuId: "gatepass", sortOrder: 3, submenus: [
        { id: "gatepass_list", sortOrder: 1 },
        { id: "gatepass_approve", sortOrder: 2 }
      ]},

      { menuId: "visitors", sortOrder: 4, submenus: [
        { id: "visitor_list", sortOrder: 1 },
        { id: "visitor_logs", sortOrder: 2 }
      ]},

      { menuId: "vehicles", sortOrder: 5, submenus: [
        { id: "vehicle_entry_logs", sortOrder: 1 },
        { id: "vehicle_exit_logs", sortOrder: 2 }
      ]}
    ]
  }
];

async function seedRoleMenus() {
  for (let rm of roleMenus) {
    const exists = await RoleMenu.findOne({ role: rm.role });
    if (!exists) {
      await RoleMenu.create(rm);
      console.log(`✔ Created role-menu mapping: ${rm.role}`);
    } else {
      // update if needed
      await RoleMenu.updateOne({ role: rm.role }, { $set: { menus: rm.menus } });
      console.log(`✔ Updated role-menu mapping: ${rm.role}`);
    }
  }
}

module.exports = seedRoleMenus;
