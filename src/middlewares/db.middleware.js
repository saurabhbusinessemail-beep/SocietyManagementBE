import database from '../config/database';

/**
 * Per-request DB connection middleware.
 *
 * On Vercel, the Lambda process is frozen between requests. The connection
 * established at startup may be dead when the Lambda thaws. This middleware
 * calls `database()` before every request so the connection is always verified
 * (and re-established if needed) before any Mongoose operation runs.
 *
 * `database()` is effectively a no-op when the connection is already healthy
 * (returns the cached instance immediately), so there is no performance cost
 * on warm requests.
 */
const ensureDbConnected = async (req, res, next) => {
  try {
    await database();
    next();
  } catch (err) {
    console.error('[DB Middleware] Could not connect to database:', err.message);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again.',
      code: 'DB_CONNECTION_ERROR'
    });
  }
};

export default ensureDbConnected;
