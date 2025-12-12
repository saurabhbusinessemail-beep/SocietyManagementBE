// scripts/seedRoleMenus.js
const RoleMenu = require("../models/roleMenu.model");

const roleMenus = [
  {
    role: "admin",
    menus: [
      { menuId: "dashboard_admin", submenus: [] },
      { menuId: "society", submenus: ["society_list","society_add","society_edit","society_settings"] },
      { menuId: "buildings", submenus: ["building_list","building_add","building_edit","floor_map"] },
      { menuId: "flats", submenus: ["flat_list","flat_create","flat_assign_owner","flat_status"] },
      { menuId: "parking", submenus: ["parking_slots","parking_assign","parking_rules"] },
      { menuId: "vehicles", submenus: ["vehicle_list","vehicle_add","vehicle_entry_logs","vehicle_exit_logs","vehicle_manage"] },
      { menuId: "gatepass", submenus: ["gatepass_list","gatepass_create","gatepass_approve","temp_gatepass"] },
      { menuId: "visitors", submenus: ["visitor_list","visitor_add","visitor_logs"] },
      { menuId: "complaints", submenus: ["complaints_list","complaint_create","complaint_manage","complaint_history"] },
      { menuId: "family", submenus: ["family_list","family_add"] },
      { menuId: "tenants", submenus: ["tenant_list","tenant_add"] },
      { menuId: "members", submenus: ["user_list","user_add","roles_permissions"] },
      { menuId: "features", submenus: ["feature_list","feature_configure","feature_pricing"] },
      { menuId: "billing", submenus: ["billing_overview","invoices","payment_history"] },
      { menuId: "announcements", submenus: ["notice_board","create_announcement"] },
      { menuId: "documents", submenus: ["docs_list","docs_upload"] },
      { menuId: "events", submenus: ["events_list","event_book"] },
      { menuId: "number_plate", submenus: ["plate_list","plate_process"] },
      { menuId: "local_manager", submenus: ["local_managers","local_manager_assign"] },
      { menuId: "audit", submenus: ["audit_logs"] },
      { menuId: "settings", submenus: ["app_settings"] },
      { menuId: "gateentry", submenus: ["gate_entry","gate_scan"] },
      { menuId: "guest", submenus: ["guest_list","guest_add"] },
      { menuId: "reports", submenus: ["reports_overview","reports_export"] },
      { menuId: "wifi_calling", submenus: ["wifi_status"] }
    ]
  },

  {
    role: "manager",
    menus: [
      { menuId: "dashboard_manager", submenus: [] },
      { menuId: "buildings", submenus: ["building_list","building_add","building_edit","floor_map"] },
      { menuId: "flats", submenus: ["flat_list","flat_create","flat_assign_owner","flat_status"] },
      { menuId: "parking", submenus: ["parking_slots","parking_assign"] },
      { menuId: "vehicles", submenus: ["vehicle_list","vehicle_entry_logs","vehicle_exit_logs"] },
      { menuId: "gatepass", submenus: ["gatepass_list","gatepass_approve","temp_gatepass"] },
      { menuId: "visitors", submenus: ["visitor_list","visitor_logs"] },
      { menuId: "complaints", submenus: ["complaints_list","complaint_manage","complaint_history"] },
      { menuId: "family", submenus: ["family_list"] },
      { menuId: "tenants", submenus: ["tenant_list","tenant_add"] },
      { menuId: "features", submenus: ["feature_list","feature_configure"] },
      { menuId: "announcements", submenus: ["notice_board","create_announcement"] },
      { menuId: "documents", submenus: ["docs_list"] },
      { menuId: "local_manager", submenus: ["local_managers"] },
      { menuId: "reports", submenus: ["reports_overview"] },
      { menuId: "gateentry", submenus: ["gate_entry","gate_scan"] }
    ]
  },

  {
    role: "owner",
    menus: [
      { menuId: "dashboard_owner", submenus: [] },
      { menuId: "flats", submenus: ["flat_details"] },
      { menuId: "family", submenus: ["family_list","family_add"] },
      { menuId: "vehicles", submenus: ["vehicle_list","vehicle_add"] },
      { menuId: "complaints", submenus: ["complaint_create","complaints_list","complaint_history"] },
      { menuId: "gatepass", submenus: ["gatepass_create","gatepass_list"] },
      { menuId: "visitors", submenus: ["visitor_list"] },
      { menuId: "announcements", submenus: ["notice_board"] },
      { menuId: "documents", submenus: ["docs_list"] }
    ]
  },

  {
    role: "tenant",
    menus: [
      { menuId: "dashboard_tenant", submenus: [] },
      { menuId: "flats", submenus: ["flat_details"] },
      { menuId: "family", submenus: ["family_list","family_add"] },
      { menuId: "vehicles", submenus: ["vehicle_list","vehicle_add"] },
      { menuId: "complaints", submenus: ["complaint_create","complaints_list"] },
      { menuId: "gatepass", submenus: ["gatepass_create","gatepass_list"] },
      { menuId: "announcements", submenus: ["notice_board"] },
      { menuId: "documents", submenus: ["docs_list"] }
    ]
  },

  {
    role: "security",
    menus: [
      { menuId: "dashboard_security", submenus: [] },
      { menuId: "gateentry", submenus: ["gate_entry","gate_scan"] },
      { menuId: "gatepass", submenus: ["gatepass_list","gatepass_approve"] },
      { menuId: "visitors", submenus: ["visitor_list","visitor_logs"] },
      { menuId: "vehicles", submenus: ["vehicle_entry_logs","vehicle_exit_logs"] }
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
