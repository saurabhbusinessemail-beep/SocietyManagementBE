const { Menu, SocietyRoleMenu } = require('../models');

export const getRoleMenu = async (roles) => {
  const uniqueRoles = [...(new Set(roles).values())];
  const roleMenus = await SocietyRoleMenu.find({ role: { $in: uniqueRoles } });
  if (!roleMenus || roleMenus.lenngth === 0) {
    return [];
  }

  const roleMenuMap = new Map();
  roleMenus.forEach(rm => {
    rm.menus.forEach(m => {
      roleMenuMap.set(m.menuId, m)
    })
  });

  const allowedMenuIds = roleMenus.reduce((menuIds, roleMenu) => {
    menuIds = menuIds.concat(roleMenu.menus.map((m) => m.menuId));
    return menuIds;
  }, []);
  // .menus.map((m) => m.menuId);
  const uniqueMenuIds = [...(new Set(allowedMenuIds))];

  // Fetch menu definitions
  const menusFromDb = await Menu.find({ menuId: { $in: uniqueMenuIds } });
  const menuDefMap = {};
  menusFromDb.forEach((m) => {
    menuDefMap[m.menuId] = m;
  });

  const finalMenus = [];

  for (const menuId of uniqueMenuIds) {
    const menuDef = menuDefMap[menuId];
    const rmMenu = roleMenuMap.get(menuId)
    if (!menuDef) continue; // skip if not found

    finalMenus.push({
      _id: menuDef._id,
      menuId: menuDef.menuId,
      menuName: menuDef.menuName,
      icon: menuDef.icon,
      relativePath: menuDef.relativePath,
      sortOrder: rmMenu?.sortOrder
    });
  }

  // Sort menus by final sortOrder
  finalMenus.sort((a, b) => a.sortOrder - b.sortOrder);

  return finalMenus;
};

export const getAllMenu = async () => {
  return await Menu.find();
};
