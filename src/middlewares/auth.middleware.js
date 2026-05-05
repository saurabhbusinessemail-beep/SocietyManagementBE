import HttpStatus from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { waitFor } from '../utils/other.util';
import * as userUtils from '../utils/user.util';
import * as MenuService from '../services/menu.service';
import cacheService from '../services/cache.service';

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

    const bearerToken = authHeader.slice(7).trim();

    if (!bearerToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'JWT token missing'
      });
    }

    const decoded = jwt.verify(bearerToken, JWT_SECRET);

    if (!decoded.user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const userId = decoded.user._id;

    // Try to get data from cache first
    const cachedData = cacheService.get(userId);

    if (cachedData) {
      // Use cached data
      res.locals.user = cachedData.user;
      res.locals.socities = cachedData.socities;
      res.locals.allMenus = cachedData.allMenus;
      res.locals.token = bearerToken;
      res.locals.fcmToken = fcmToken;
      res.locals.fromCache = true; // Flag to indicate cache hit

      // console.log(`Serving from cache for user: ${userId}`);
      return next();
    }

    // Cache miss - fetch fresh data
    // console.log(`Cache miss, fetching fresh data for user: ${userId}`);

    // Fetch societies and roles
    const { socities, roles } = await userUtils.userSocitiesWithRole(userId);

    // Get menus based on role
    const allMenus = decoded.user.role === 'user'
      ? await MenuService.getRoleMenu(roles)
      : await MenuService.getAllMenu(decoded.user.isSuperAdmin);

    // Store in locals
    res.locals.user = decoded.user;
    res.locals.socities = socities ?? [];
    res.locals.allMenus = allMenus ?? [];
    res.locals.token = bearerToken;
    res.locals.fcmToken = fcmToken;
    res.locals.fromCache = false;

    // Store complete data in cache
    cacheService.set(userId, {
      user: decoded.user,
      socities: socities ?? [],
      allMenus: allMenus ?? []
    });

    next();
  } catch (error) {
    console.log('Token Error: ', error);
    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    });
  }
};
