const { getRoleMenu } = require('../services/user.service');

/**
 * Middleware to check permissions against role menus
 * @param {string[]} requiredPermissions
 */
export const checkPermissions = (requiredPermissions = []) => {
    return async (req, res, next) => {
        try {
            const user = res.locals.user;

            if (!user || !user.userId || !user.role) {
                return res.status(401).json({
                    message: 'Unauthorized: user context missing'
                });
            }

            const role = user.role;

            const roleMenus = await getRoleMenu(role);

            if (!Array.isArray(roleMenus)) {
                return res.status(403).json({
                    message: 'Access denied: no menus found for role'
                });
            }

            // Collect permissions from menus → submenus
            const rolePermissions = new Set();

            roleMenus.forEach(menu => {
                if (!menu || !Array.isArray(menu.submenus)) return;

                menu.submenus.forEach(submenu => {
                    if (Array.isArray(submenu.permissions)) {
                        submenu.permissions.forEach(permission => {
                            rolePermissions.add(permission);
                        });
                    }
                });
            });

            // OR logic: at least one permission must match
            const hasPermission = requiredPermissions.some(permission =>
                rolePermissions.has(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    message: 'Forbidden: insufficient permissions',
                    requiredPermissions
                });
            }

            next();
        } catch (error) {
            console.error('Permission middleware error:', error);
            return res.status(500).json({
                message: 'Internal server error while checking permissions'
            });
        }
    };
};
