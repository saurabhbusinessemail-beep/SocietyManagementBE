import HttpStatus from 'http-status-codes';
import jwt from 'jsonwebtoken';
import * as userUtils from '../utils/user.util';
import * as MenuService from '../services/menu.service';

const JWT_SECRET = process.env.JWT_SECRET || 'skSecret';

/**
 * Middleware to authenticate if user has a valid Authorization token
 * Authorization: Bearer <token>
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const fcmToken = req.headers.fcmToken;

    if (!authHeader) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authorization header missing'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Authorization format must be Bearer <token>'
      });
    }

    const bearerToken = authHeader.slice(7).trim(); // safer than split

    if (!bearerToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'JWT token missing'
      });
    }

    const decoded = jwt.verify(bearerToken, JWT_SECRET);

    if (!decoded.user) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token2'
      });
      return;
    }

    // Fetch Socities and Roles
    const { socities, roles } = await userUtils.userSocitiesWithRole(decoded.user._id);

    // Get Menus
    const allMenus =
      decoded.user.role === 'user'
        ? await MenuService.getRoleMenu(roles)
        : await MenuService.getAllMenu();

    res.locals.user = decoded.user;
    res.locals.socities = socities ?? [];
    res.locals.allMenus = allMenus ?? [];
    res.locals.token = bearerToken;
    res.locals.fcmToken = fcmToken;

    next();
  } catch (error) {
    console.log('Token Error: ', error)
    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message:
        error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token3'
    });
  }
};
