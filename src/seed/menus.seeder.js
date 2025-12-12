// scripts/seedMenus.js
const Menu = require("../models/menu.model");
const Permission = require("../models/permission.model");

/**
 * Full menu list including role-specific dashboard menus:
 * - dashboard_admin, dashboard_manager, dashboard_owner, dashboard_tenant, dashboard_security
 */
const menus = [
  // role-specific dashboards (each is a separate Menu doc)
  {
    menuId: "dashboard_admin",
    menuName: "Dashboard",
    icon: "dashboard",
    relativePath: "/admin/dashboard",
    submenus: []
  },
  {
    menuId: "dashboard_manager",
    menuName: "Dashboard",
    icon: "dashboard",
    relativePath: "/manager/dashboard",
    submenus: []
  },
  {
    menuId: "dashboard_owner",
    menuName: "Dashboard",
    icon: "dashboard",
    relativePath: "/owner/dashboard",
    submenus: []
  },
  {
    menuId: "dashboard_tenant",
    menuName: "Dashboard",
    icon: "dashboard",
    relativePath: "/tenant/dashboard",
    submenus: []
  },
  {
    menuId: "dashboard_security",
    menuName: "Dashboard",
    icon: "dashboard",
    relativePath: "/security/dashboard",
    submenus: []
  },

  // Universal menus (role-agnostic)
  {
    menuId: "society",
    menuName: "Societies",
    icon: "apartment",
    relativePath: "",
    submenus: [
      { submenuId: "society_list", submenuName: "Society List", relativePath: "/society/list", permissions: ["society.view"] },
      { submenuId: "society_add", submenuName: "Add Society", relativePath: "/society/add", permissions: ["society.add"] },
      { submenuId: "society_edit", submenuName: "Edit Society", relativePath: "/society/edit", permissions: ["society.update"] },
      { submenuId: "society_settings", submenuName: "Society Settings", relativePath: "/society/settings", permissions: ["society.update","feature.manage"] }
    ]
  },
  {
    menuId: "buildings",
    menuName: "Buildings",
    icon: "domain",
    submenus: [
      { submenuId: "building_list", submenuName: "Building List", relativePath: "/buildings", permissions: ["building.view"] },
      { submenuId: "building_add", submenuName: "Add Building", relativePath: "/buildings/add", permissions: ["building.add"] },
      { submenuId: "building_edit", submenuName: "Edit Building", relativePath: "/buildings/edit", permissions: ["building.update"] },
      { submenuId: "floor_map", submenuName: "Floor / Unit Map", relativePath: "/buildings/floormap", permissions: ["building.view","flat.manage"] }
    ]
  },
  {
    menuId: "flats",
    menuName: "Flats",
    icon: "home",
    submenus: [
      { submenuId: "flat_list", submenuName: "Flat List", relativePath: "/flats", permissions: ["flat.view"] },
      { submenuId: "flat_create", submenuName: "Create / Edit Flat", relativePath: "/flats/create", permissions: ["flat.add","flat.update"] },
      { submenuId: "flat_assign_owner", submenuName: "Assign Owner / Tenant", relativePath: "/flats/assign", permissions: ["flat.update","member.manage"] },
      { submenuId: "flat_status", submenuName: "Change Flat Status", relativePath: "/flats/status", permissions: ["flat.update"] }
    ]
  },
  {
    menuId: "parking",
    menuName: "Parking",
    icon: "local_parking",
    submenus: [
      { submenuId: "parking_slots", submenuName: "Parking Slots", relativePath: "/parking/slots", permissions: ["parking.view"] },
      { submenuId: "parking_assign", submenuName: "Assign Parking", relativePath: "/parking/assign", permissions: ["parking.update","parking.manage"] },
      { submenuId: "parking_rules", submenuName: "Parking Rules", relativePath: "/parking/rules", permissions: ["parking.manage"] }
    ]
  },
  {
    menuId: "vehicles",
    menuName: "Vehicles",
    icon: "directions_car",
    submenus: [
      { submenuId: "vehicle_list", submenuName: "Vehicle List", relativePath: "/vehicles", permissions: ["vehicle.view"] },
      { submenuId: "vehicle_add", submenuName: "Add Vehicle", relativePath: "/vehicles/add", permissions: ["vehicle.add"] },
      { submenuId: "vehicle_entry_logs", submenuName: "Entry Logs", relativePath: "/vehicles/entry", permissions: ["vehicle.view","gateentry.view"] },
      { submenuId: "vehicle_exit_logs", submenuName: "Exit Logs", relativePath: "/vehicles/exit", permissions: ["vehicle.view","gateentry.view"] },
      { submenuId: "vehicle_manage", submenuName: "Vehicle Management", relativePath: "/vehicles/manage", permissions: ["vehicle.manage"] }
    ]
  },
  {
    menuId: "gatepass",
    menuName: "Gate Pass",
    icon: "vpn_key",
    submenus: [
      { submenuId: "gatepass_list", submenuName: "Gate Pass List", relativePath: "/gatepass", permissions: ["gatepass.view"] },
      { submenuId: "gatepass_create", submenuName: "Create Gate Pass", relativePath: "/gatepass/create", permissions: ["gatepass.add"] },
      { submenuId: "gatepass_approve", submenuName: "Approve / Reject", relativePath: "/gatepass/approvals", permissions: ["gatepass.approve","gatepass.reject"] },
      { submenuId: "temp_gatepass", submenuName: "Temporary Gate Pass", relativePath: "/gatepass/temp", permissions: ["tempGatepass.view","tempGatepass.add"] }
    ]
  },
  {
    menuId: "visitors",
    menuName: "Visitors",
    icon: "people",
    submenus: [
      { submenuId: "visitor_list", submenuName: "Visitor List", relativePath: "/visitors", permissions: ["visitor.view"] },
      { submenuId: "visitor_add", submenuName: "Add Visitor", relativePath: "/visitors/add", permissions: ["visitor.add"] },
      { submenuId: "visitor_logs", submenuName: "Visitor Logs", relativePath: "/visitors/logs", permissions: ["visitor.view","gateentry.view"] }
    ]
  },
  {
    menuId: "complaints",
    menuName: "Complaints",
    icon: "report_problem",
    submenus: [
      { submenuId: "complaints_list", submenuName: "All Complaints", relativePath: "/complaints", permissions: ["complaint.view"] },
      { submenuId: "complaint_create", submenuName: "Raise Complaint", relativePath: "/complaints/new", permissions: ["complaint.add"] },
      { submenuId: "complaint_manage", submenuName: "Manage Complaints", relativePath: "/complaints/manage", permissions: ["complaint.manage"] },
      { submenuId: "complaint_history", submenuName: "Complaint History", relativePath: "/complaints/history", permissions: ["complaint.view"] }
    ]
  },
  {
    menuId: "family",
    menuName: "Family Management",
    icon: "group_add",
    submenus: [
      { submenuId: "family_list", submenuName: "Family Members", relativePath: "/family", permissions: ["member.view"] },
      { submenuId: "family_add", submenuName: "Add Family Member", relativePath: "/family/add", permissions: ["member.add"] }
    ]
  },
  {
    menuId: "tenants",
    menuName: "Tenant Management",
    icon: "supervisor_account",
    submenus: [
      { submenuId: "tenant_list", submenuName: "Tenant List", relativePath: "/tenants", permissions: ["tenant.view"] },
      { submenuId: "tenant_add", submenuName: "Add Tenant", relativePath: "/tenants/add", permissions: ["tenant.add"] }
    ]
  },
  {
    menuId: "members",
    menuName: "Users & Members",
    icon: "person",
    submenus: [
      { submenuId: "user_list", submenuName: "User List", relativePath: "/users", permissions: ["member.view","user.view"] },
      { submenuId: "user_add", submenuName: "Add User", relativePath: "/users/add", permissions: ["member.add","user.add"] },
      { submenuId: "roles_permissions", submenuName: "Roles & Permissions", relativePath: "/users/roles", permissions: ["permission.view","role.view"] }
    ]
  },
  {
    menuId: "features",
    menuName: "Feature Management",
    icon: "extension",
    submenus: [
      { submenuId: "feature_list", submenuName: "Feature List", relativePath: "/features", permissions: ["feature.view"] },
      { submenuId: "feature_configure", submenuName: "Configure Feature Rules", relativePath: "/features/configure", permissions: ["feature.manage"] },
      { submenuId: "feature_pricing", submenuName: "Feature Pricing", relativePath: "/features/pricing", permissions: ["feature.manage","society.view"] }
    ]
  },
  {
    menuId: "billing",
    menuName: "Society Billing",
    icon: "receipt",
    submenus: [
      { submenuId: "billing_overview", submenuName: "Billing Overview", relativePath: "/billing", permissions: ["society.view","feature.view"] },
      { submenuId: "invoices", submenuName: "Invoices & Payments", relativePath: "/billing/invoices", permissions: ["society.view","feature.manage"] },
      { submenuId: "payment_history", submenuName: "Payment History", relativePath: "/billing/history", permissions: ["society.view"] }
    ]
  },
  {
    menuId: "announcements",
    menuName: "Announcements",
    icon: "campaign",
    submenus: [
      { submenuId: "notice_board", submenuName: "Notice Board", relativePath: "/announcements", permissions: ["feature.view"] },
      { submenuId: "create_announcement", submenuName: "Create Announcement", relativePath: "/announcements/new", permissions: ["feature.manage"] }
    ]
  },
  {
    menuId: "documents",
    menuName: "Documents",
    icon: "folder",
    submenus: [
      { submenuId: "docs_list", submenuName: "Documents", relativePath: "/documents", permissions: ["feature.view"] },
      { submenuId: "docs_upload", submenuName: "Upload Documents", relativePath: "/documents/upload", permissions: ["feature.manage"] }
    ]
  },
  {
    menuId: "events",
    menuName: "Events / Bookings",
    icon: "event",
    submenus: [
      { submenuId: "events_list", submenuName: "Events", relativePath: "/events", permissions: ["feature.view"] },
      { submenuId: "event_book", submenuName: "Book Facility", relativePath: "/events/book", permissions: ["feature.add"] }
    ]
  },
  {
    menuId: "number_plate",
    menuName: "Number Plate Processing",
    icon: "camera",
    submenus: [
      { submenuId: "plate_list", submenuName: "Number Plate Records", relativePath: "/plate", permissions: ["feature.view"] },
      { submenuId: "plate_process", submenuName: "Process Number Plate", relativePath: "/plate/process", permissions: ["feature.manage"] }
    ]
  },
  {
    menuId: "settings",
    menuName: "System Settings",
    icon: "settings",
    submenus: [
      { submenuId: "app_settings", submenuName: "App Settings", relativePath: "/settings", permissions: ["feature.manage"] }
    ]
  },
  {
    menuId: "gateentry",
    "menuName": "Gate Entry",
    "icon": "input",
    "submenus": [
      { "submenuId": "gate_entry", "submenuName": "Gate Entry Logs", "relativePath": "/gateentry/logs", "permissions": ["gateentry.view"] },
      { "submenuId": "gate_scan", "submenuName": "Scan / Validate", "relativePath": "/gateentry/scan", "permissions": ["gateentry.manage"] }
    ]
  },
  {
    menuId: "guest",
    menuName: "Guest Management",
    icon: "person_add_alt_1",
    submenus: [
      { submenuId: "guest_list", submenuName: "Guest List", relativePath: "/guests", permissions: ["visitor.view"] },
      { submenuId: "guest_add", submenuName: "Add Guest", relativePath: "/guests/add", permissions: ["visitor.add"] }
    ]
  },
  {
    menuId: "reports",
    menuName: "Reports",
    icon: "bar_chart",
    submenus: [
      { submenuId: "reports_overview", submenuName: "Reports Overview", relativePath: "/reports", permissions: ["feature.view"] },
      { submenuId: "reports_export", submenuName: "Export Reports", relativePath: "/reports/export", permissions: ["feature.manage"] }
    ]
  },
  {
    menuId: "wifi_calling",
    menuName: "WiFi Calling",
    icon: "wifi",
    submenus: [
      { submenuId: "wifi_status", submenuName: "WiFi Calling Status", relativePath: "/wifi", permissions: ["feature.view"] }
    ]
  }
];

async function ensurePermissionExists(key) {
  const exists = await Permission.findOne({ key });
  if (!exists) {
    const [module, action] = (key || "").split(".");
    await Permission.create({ key, module: module || "misc", action: action || "view", description: `${action} ${module}` });
    console.log(`⚠️ Added missing permission: ${key}`);
  }
}

async function seedMenus() {
  for (let menu of menus) {
    // ensure menu sub-permissions exist
    if (Array.isArray(menu.submenus)) {
      for (let sub of menu.submenus) {
        if (Array.isArray(sub.permissions)) {
          for (let p of sub.permissions) {
            await ensurePermissionExists(p);
          }
        }
      }
    }

    const exists = await Menu.findOne({ menuId: menu.menuId });
    if (!exists) {
      console.log('Creating Menu ', menu.menuId)
      await Menu.create(menu);
      console.log(`✔ Menu created: ${menu.menuId}`);
    } else {
      console.log(`✔ Menu exists: ${menu.menuId}`);
    }
  }
}

module.exports = seedMenus;
