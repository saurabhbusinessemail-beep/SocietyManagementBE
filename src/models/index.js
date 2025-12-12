// put this in models/index.js to export everything simply
const User = require('./user.model');
const Role = require('./role.model');
const Society = require('./society.model');
const Building = require('./building.model');
const Flat = require('./flat.model');
const FlatMember = require('./flatMember.model');
const Tenant = require('./tenant.model');
const Vehicle = require('./vehicle.model');
const GatePass = require('./gatepass.model');
const Visitor = require('./visitor.model');
const Complaint = require('./complaint.model');
const Notification = require('./notification.model');
const Parking = require('./parking.model');
const Otp = require('./otp.model');
const Permissions = require('./permission.model');
const Features = require('./feature.model');
const Menu = require('./menu.model');

module.exports = {
  User,
  Role,
  Society,
  Building,
  Flat,
  FlatMember,
  Tenant,
  Vehicle,
  GatePass,
  Visitor,
  Complaint,
  Notification,
  Parking,
  Otp,
  Permissions,
  Features,
  Menu
};
