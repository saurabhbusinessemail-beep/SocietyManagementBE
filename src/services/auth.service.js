import * as MenuService from './menu.service';
import * as userUtils from '../utils/user.util';

const JWT_SECRET = process.env.JWT_SECRET || 'skSecret';
const jwt = require('jsonwebtoken');

export const getUserToken = async (user) => {
    const jwtUser = {
        _id: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        status: user.status,
        profilePic: user.profilePic,
        role: user.role
    };

    // Fetch Socities and Roles
    const { socities, roles } = await userUtils.userSocitiesWithRole(user._id);

    // Get Menus
    const allMenus =
        user.role === 'user'
            ? await MenuService.getRoleMenu(roles)
            : await MenuService.getAllMenu();

    // Generate JWT with basic info only
    const token = jwt.sign(
        {
            user: jwtUser,
            socities,
            allMenus
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
    return token;
}