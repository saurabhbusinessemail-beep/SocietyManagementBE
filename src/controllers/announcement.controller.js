const announcementService = require('../services/announcement.service');

/**
 * Create a new announcement
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const announcementData = {
      ...req.body,
      societyId: req.body.societyId || req.params.societyId
    };

    const result = await announcementService.createAnnouncement(announcementData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Announcement created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single announcement
 */
export const getAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await announcementService.getAnnouncementById(id, res.locals.user._id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all announcements for a society
 */
export const getSocietyAnnouncements = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const filters = {
      ...req.query,
      // userId: res.locals.user._id
    };

    const result = await announcementService.getSocietyAnnouncements(societyId, filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await announcementService.updateAnnouncement(id, req.body, res.locals.user._id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: result,
      message: 'Announcement updated successfully'
    });
  } catch (error) {
    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await announcementService.deleteAnnouncement(id, res.locals.user._id);

    if (result === null) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Toggle pin status
 */
export const togglePinAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await announcementService.togglePinAnnouncement(id, res.locals.user._id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: result,
      message: `Announcement ${result.isPinned ? 'pinned' : 'unpinned'} successfully`
    });
  } catch (error) {
    if (error.message.includes('Only admins')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get announcement statistics
 */
export const getAnnouncementStats = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const result = await announcementService.getAnnouncementStats(societyId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search announcements
 */
export const searchAnnouncements = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const { q: searchTerm, ...options } = req.query;

    const result = await announcementService.searchAnnouncements(societyId, searchTerm, options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get announcements by category
 */
export const getAnnouncementsByCategory = async (req, res, next) => {
  try {
    const { societyId, category } = req.params;
    const filters = {
      ...req.query,
      userId: res.locals.user._id
    };

    const result = await announcementService.getAnnouncementsByCategory(societyId, category, filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get announcements by priority
 */
export const getAnnouncementsByPriority = async (req, res, next) => {
  try {
    const { societyId, priority } = req.params;
    const filters = {
      ...req.query,
      userId: res.locals.user._id
    };

    const result = await announcementService.getAnnouncementsByPriority(societyId, priority, filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update announcements
 */
export const bulkUpdateAnnouncements = async (req, res, next) => {
  try {
    const { ids, updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide announcement IDs to update'
      });
    }

    const result = await announcementService.bulkUpdateAnnouncements(ids, updates, res.locals.user._id);

    res.json({
      success: true,
      data: result,
      message: 'Announcements updated successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Export announcements
 */
export const exportAnnouncements = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const { format = 'json' } = req.query;

    const result = await announcementService.exportAnnouncements(societyId, format);

    // Set appropriate headers for download
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=announcements-${societyId}-${Date.now()}.csv`);
      return res.send(result);
    }

    res.json({
      success: true,
      data: result,
      format: 'json'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pinned announcements
 */
export const getPinnedAnnouncements = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const filters = {
      ...req.query,
      pinned: true,
      userId: res.locals.user._id
    };

    const result = await announcementService.getSocietyAnnouncements(societyId, filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming announcements (not expired)
 */
export const getUpcomingAnnouncements = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const filters = {
      ...req.query,
      status: 'published',
      userId: res.locals.user._id
    };

    const result = await announcementService.getSocietyAnnouncements(societyId, filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish an announcement
 */
export const publishAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await announcementService.publishAnnouncement(id, res.locals.user._id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: result,
      message: 'Announcement published successfully'
    });
  } catch (error) {
    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('already published')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Unpublish an announcement
 */
export const unpublishAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await announcementService.unpublishAnnouncement(id, res.locals.user._id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: result,
      message: 'Announcement unpublished successfully'
    });
  } catch (error) {
    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('already unpublished')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Track view for an announcement
 */
export const trackView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userInfo = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    };

    const result = await announcementService.trackView(id, res.locals.user._id, userInfo);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: result,
      message: 'View tracked successfully'
    });
  } catch (error) {
    next(error);
  }
};
