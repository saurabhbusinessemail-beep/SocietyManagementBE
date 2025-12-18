import * as UserService from '../services/user.service';

const jwt = require('jsonwebtoken');
const { User, Otp, Role, Menu, RoleMenu } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'skSecret';

// STEP 1: Generate OTP
export const requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if user exists with this phoneNumber
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      const newUser = {
        phoneNumber
      };
      await UserService.newUser(newUser);
      // return res
      //   .status(404)
      //   .json({ message: 'User not found with this phoneNumber' });
    }

    // Generate random 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP temporarily
    await Otp.create({ phoneNumber, otp });

    console.log(`OTP for ${phoneNumber}: ${otp}`); // For Dev, remove in production

    return res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// STEP 2: Verify OTP + generate JWT token
export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ message: 'Phone number and OTP are required' });
    }

    // check OTP
    const validOtp = await Otp.findOne({ phoneNumber, otp });

    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP matched → Delete the OTP record (optional)
    await Otp.deleteMany({ phoneNumber });

    // Fetch user
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT with basic info only
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ME API: Get user details from JWT token
export const getProfile = async (req, res) => {
  try {
    // Fetch user
    const user = await User.findById(res.locals.user.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // -----------------------------------------------------
    // FETCH ALL PERMISSIONS BASED ON USER ROLES
    // -----------------------------------------------------
    let allPermissions = [];
    let allMenus = [];

    if (user.role) {
      const role = await Role.findOne({ name: user.role });

      if (role.permissions && Array.isArray(role.permissions)) {
        allPermissions.push(...role.permissions);
      }

      allMenus = await getRoleMenu(role.name);
    }

    // Merge + remove duplicates
    allPermissions = [...new Set(allPermissions)];

    return res.json({
      success: true,
      user: user,
      permissions: allPermissions,
      menus: allMenus
    });
  } catch (err) {
    console.error(err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ME API: Get user details from JWT token
export const getAllRoleMenus = async (req, res) => {
  try {
    const roles = await Role.find();
    let obj = {};
    for(let role of roles) {
      const roleMenu = await getRoleMenu(role.name);
      obj[role.name] = roleMenu;
    }
    res.json(obj);
  } catch (err) {
    console.error(err);

    return res.status(401).json({ message: 'Failed' });
  }
};

const getRoleMenu = async (role) => {
  const roleMenu = await RoleMenu.findOne({ role });
  if (!roleMenu) {
    return [];
  }

  const allowedMenuIds = roleMenu.menus.map((m) => m.menuId);

  // Fetch menu definitions
  const menusFromDb = await Menu.find({ menuId: { $in: allowedMenuIds } });
  const menuDefMap = {};
  menusFromDb.forEach(m => { menuDefMap[m.menuId] = m; });

  const finalMenus = [];
  let mergedPermissions = new Set();

  for (const rmMenu of roleMenu.menus) {
    const menuId = rmMenu.menuId;
    const menuDef = menuDefMap[menuId];
    if (!menuDef) continue; // skip if not found

    // Build submenu permission + sortOrder maps
    const allowedSubmenuIds = new Set();
    const submenuSortMap = {};

    if (Array.isArray(rmMenu.submenus)) {
      rmMenu.submenus.forEach((sm) => {
        if (typeof sm === 'string') {
          allowedSubmenuIds.add(sm);
        } else if (sm && sm.id) {
          allowedSubmenuIds.add(sm.id);
          if (typeof sm.sortOrder === 'number') {
            submenuSortMap[sm.id] = sm.sortOrder;
          }
        }
      });
    }

    // Filter submenu definitions from Menu model
    const filteredSubmenus = (menuDef.submenus || [])
      .filter((sm) => allowedSubmenuIds.has(sm.submenuId))
      .map((sm) => {
        if (sm.permissions?.length) {
          sm.permissions.forEach((p) => mergedPermissions.add(p));
        }

        return {
          submenuId: sm.submenuId,
          submenuName: sm.submenuName,
          icon: sm.icon,
          relativePath: sm.relativePath,
          permissions: sm.permissions,
          sortOrder: submenuSortMap[sm.submenuId] ?? sm.sortOrder ?? 9999
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Determine menu sortOrder (roleMenus is authoritative)
    const menuSort =
      typeof rmMenu.sortOrder === 'number'
        ? rmMenu.sortOrder
        : menuDef.sortOrder ?? 9999;

    // Determine menu relativePath
    let finalRelativePath = menuDef.relativePath;

    // NEW RULE:
    // If menu has no relativePath AND has submenus → use first submenu’s relativePath
    if (
      (!finalRelativePath || finalRelativePath.trim() === '') &&
      filteredSubmenus.length > 0
    ) {
      finalRelativePath = filteredSubmenus[0].relativePath;
    }

    finalMenus.push({
      menuId: menuDef.menuId,
      menuName: menuDef.menuName,
      sortOrder: menuSort,
      icon: menuDef.icon,
      relativePath: finalRelativePath,
      submenus: filteredSubmenus
    });
  }

  // Sort menus by final sortOrder
  finalMenus.sort((a, b) => a.sortOrder - b.sortOrder);

  return finalMenus;
};
