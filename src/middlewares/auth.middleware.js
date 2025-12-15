import HttpStatus from 'http-status-codes';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'skSecret';

/**
 * Middleware to authenticate if user has a valid Authorization token
 * Authorization: Bearer <token>
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export const userAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

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

    res.locals.user = decoded;
    res.locals.token = bearerToken;

    next();
  } catch (error) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message:
        error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    });
  }
};
