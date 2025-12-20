const { User, Menu, RoleMenu } = require('../models');

//get all users
export const getAllUsers = async () => {
  const data = await User.find();
  return data;
};

//create new user
export const newUser = async (body) => {
  const data = await User.create(body);
  return data;
};

//update single user
export const updateUser = async (_id, body) => {
  const data = await User.findByIdAndUpdate(
    {
      _id
    },
    body,
    {
      new: true
    }
  );
  return data;
};

//delete single user
export const deleteUser = async (id) => {
  await User.findByIdAndDelete(id);
  return '';
};

//get single user
export const getUser = async (id) => {
  const data = await User.findById(id);
  return data;
};

export const searchUsers = async (search, options = {}) => {
  const { page = 1, limit = 20 } = options;

  // If no search text → return empty array (or all users if you prefer)
  if (!search || !search.trim()) {
    return {
      data: [],
      total: 0,
      page,
      limit
    };
  }

  const regex = new RegExp(search.trim(), 'i'); // case-insensitive

  const filter = {
    $or: [
      { name: regex },
      { email: regex },
      { phoneNumber: regex } // or phone if your schema uses phone
    ]
  };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
    User.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit
  };
};

export const getRoleMenu = async (role) => {
  const roleMenu = await RoleMenu.findOne({ role });
  if (!roleMenu) {
    return [];
  }

  const allowedMenuIds = roleMenu.menus.map((m) => m.menuId);

  // Fetch menu definitions
  const menusFromDb = await Menu.find({ menuId: { $in: allowedMenuIds } });
  const menuDefMap = {};
  menusFromDb.forEach((m) => {
    menuDefMap[m.menuId] = m;
  });

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
