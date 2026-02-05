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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.status(201).json(result);
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
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
      userId: res.locals.user._id
    };

    const result = await announcementService.getSocietyAnnouncements(societyId, filters);

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
  } catch (error) {
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
  } catch (error) {
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
  } catch (error) {
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
  } catch (error) {
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    // Set appropriate headers for download
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=announcements-${societyId}-${Date.now()}.csv`);
      return res.send(result.data);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's recent announcements
 */
// export const getUserAnnouncements = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const filters = {
//       ...req.query,
//       createdByUserId: userId
//     };

//     const result = await announcementService.getSocietyAnnouncements(req.userSociety.societyId, filters);

//     if (!result.success) {
//       return res.status(result.code || 500).json(result);
//     }

//     res.json(result);
//   } catch (error) {
//     next(error)
//   }
// };

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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
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

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Publish an announcement
 */
export const publishAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await announcementService.publishAnnouncement(id, req.user.id);

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Unpublish an announcement
 */
export const unpublishAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await announcementService.unpublishAnnouncement(id, req.user.id);

    if (!result.success) {
      return res.status(result.code || 500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
