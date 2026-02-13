import * as MenuService from './menu.service';

const JWT_SECRET = process.env.JWT_SECRET || 'skSecret';
const jwt = require('jsonwebtoken');

export const getUserToken = async (user) => {
    const jwtUser = {
        _id: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        status: user.status,
        role: user.role
    };

    // Generate JWT with basic info only
    const token = jwt.sign(
        {
            user: jwtUser
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
    return token;
}