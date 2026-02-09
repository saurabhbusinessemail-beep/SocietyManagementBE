const { Announcement, Comments } = require('../models');

/**
 * Helper function to extract societyId from request
 * For announcement and comment routes only
 */
const extractSocietyId = async (req) => {
  try {
    // 1. Direct from params (for routes with /society/:societyId)
    if (req.params.societyId) {
      return req.params.societyId;
    }

    // 2. From announcement ID in params
    if (req.params.announcementId) {
      const announcement = await Announcement.findById(req.params.announcementId).select('societyId');
      if (announcement && announcement.societyId) {
        return announcement.societyId;
      }
    }

    // 3. From announcement ID in comment routes
    if (req.params.id && req.originalUrl.includes('/comments/')) {
      // This is a comment ID, get its announcement
      const comment = await Comments.findById(req.params.id).select('announcementId');
      if (comment && comment.announcementId) {
        const announcement = await Announcement.findById(comment.announcementId).select('societyId');
        if (announcement && announcement.societyId) {
          return announcement.societyId;
        }
      }
    }

    // 4. From announcement ID in announcement routes (single announcement)
    if (req.params.id && req.originalUrl.includes('/announcements/')) {
      const announcement = await Announcement.findById(req.params.id).select('societyId');
      if (announcement && announcement.societyId) {
        return announcement.societyId;
      }
    }

    // 5. From request body (for POST /announcements or POST /comments)
    if (req.body.societyId) {
      return req.body.societyId;
    }

    if (req.body.announcementId) {
      const announcement = await Announcement.findById(req.body.announcementId).select('societyId');
      if (announcement && announcement.societyId) {
        return announcement.societyId;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting societyId:', error);
    return null;
  }
};

/**
 * Helper to find user's society from their societies array
 */
const getUserSociety = (userSocieties, societyId) => {
  if (!userSocieties || !societyId) return null;

  return userSocieties.find((society) => society.societyId && society.societyId.toString() === societyId.toString());
};

/**
 * Helper to check if user has admin/manager role
 */
const hasAdminRole = (societyRoles) => {
  if (!societyRoles || !Array.isArray(societyRoles)) return false;

  const adminRoles = ['societyadmin', 'manager'];
  return societyRoles.some((role) => role.name && adminRoles.includes(role.name.toLowerCase()));
};

/**
 * Middleware to check if user is a society member
 * For announcement and comment routes
 */
const isSocietyMember = async (req, res, next) => {
  try {
    // Get user's societies from res.locals (attached by auth middleware)
    const userSocieties = res.locals.societies || [];

    if (!userSocieties || userSocieties.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of any society'
      });
    }

    // Extract societyId based on route
    const societyId = await extractSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Society ID could not be determined'
      });
    }

    // Find user's membership in this society
    const userSociety = getUserSociety(userSocieties, societyId);

    if (!userSociety) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this society'
      });
    }

    // Attach info to request
    req.userSociety = userSociety;
    req.societyId = societyId;
    req.userSocietyRoles = userSociety.societyRoles.map((role) => role.name);

    next();
  } catch (error) {
    console.error('Error in isSocietyMember middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking society membership',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user is a society admin/manager
 * For announcement and comment routes
 */
const isSocietyAdmin = async (req, res, next) => {
  try {
    // Get user's societies from res.locals
    const userSocieties = res.locals.societies || [];

    if (!userSocieties || userSocieties.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of any society'
      });
    }

    // Extract societyId based on route
    const societyId = await extractSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Society ID could not be determined'
      });
    }

    // Find user's membership in this society
    const userSociety = getUserSociety(userSocieties, societyId);

    if (!userSociety) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this society'
      });
    }

    // Check if user has admin/manager role
    const isAdmin = hasAdminRole(userSociety.societyRoles);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin/Manager privileges required'
      });
    }

    // Attach info to request
    req.userSociety = userSociety;
    req.societyId = societyId;
    req.userSocietyRoles = userSociety.societyRoles.map((role) => role.name);
    req.isSocietyAdmin = true;

    next();
  } catch (error) {
    console.error('Error in isSocietyAdmin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking admin privileges',
      error: error.message
    });
  }
};

module.exports = {
  isSocietyMember,
  isSocietyAdmin
};
