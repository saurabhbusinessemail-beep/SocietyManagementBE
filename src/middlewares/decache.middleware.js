// middleware/decacheMiddleware.js
import cacheService from '../services/cache.service';

/**
 * Middleware to invalidate cache for specific users
 * Use this on routes that modify user data, societies, or menus
 */
export const decacheUsers = (userIdSource = 'user') => {
    return async (req, res, next) => {
        try {
            // Get user ID from various possible sources
            let userId = null;

            switch (userIdSource) {
                case 'param':
                    userId = req.params.userId || req.params.id;
                    break;
                case 'body':
                    userId = req.body.userId || req.body.user_id;
                    break;
                case 'query':
                    userId = req.query.userId || req.query.user_id;
                    break;
                case 'locals':
                    userId = res.locals.user?._id;
                    break;
                case 'all':
                    // Invalidate all cache (use with caution!)
                    cacheService.clear();
                    // console.log('All cache invalidated');
                    return next();
                default:
                    // Default to current authenticated user
                    userId = res.locals.user?._id;
            }

            if (userId) {
                if (Array.isArray(userId)) {
                    // Invalidate multiple users
                    userId.forEach(id => cacheService.invalidate(id));
                    // console.log(`Cache invalidated for users: ${userId.join(', ')}`);
                } else {
                    // Invalidate single user
                    cacheService.invalidate(userId);
                    // console.log(`Cache invalidated for user: ${userId}`);
                }
            }

            next();
        } catch (error) {
            console.error('Decache error:', error);
            next(); // Don't block the request if decaching fails
        }
    };
};

// Specific middleware for common scenarios
export const decacheCurrentUser = decacheUsers('locals');
export const decacheUserById = decacheUsers('param');
export const decacheAllUsers = decacheUsers('all');