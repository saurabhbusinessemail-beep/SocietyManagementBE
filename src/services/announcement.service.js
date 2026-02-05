const Announcement = require('../models/announcement.model');
const Comment = require('../models/comments.model');
const mongoose = require('mongoose');

/**
 * Create a new announcement
 */
export const createAnnouncement = async (data) => {
  try {
    const announcement = new Announcement({
      ...data,
      status: data.status || 'published'
    });

    await announcement.save();

    // Populate creator info
    const populated = await announcement.populate('createdByUserId');

    return {
      success: true,
      data: populated,
      message: 'Announcement created successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error creating announcement',
      error: error.message
    };
  }
};

/**
 * Get announcement by ID
 */
export const getAnnouncementById = async (id, userId = null) => {
  try {
    const announcement = await Announcement.findById(id)
      .populate('createdByUserId')
      .populate({
        path: 'comments',
        match: { isDeleted: false, isHidden: false },
        options: {
          sort: { isPinned: -1, createdOn: -1 },
          limit: 20
        },
        populate: {
          path: 'userId',
          select: 'name profilePicture'
        }
      });

    if (!announcement) {
      return {
        success: false,
        message: 'Announcement not found',
        code: 404
      };
    }

    // Check if user has viewed this announcement
    if (userId) {
      const hasViewed = announcement.views.some((view) => view.userId.toString() === userId.toString());

      if (!hasViewed) {
        announcement.views.push({ userId });
        announcement.viewCount += 1;
        await announcement.save();
      }
    }

    // Get comment count
    const commentCount = await Comment.countDocuments({
      announcementId: id,
      isDeleted: false,
      isHidden: false
    });

    return {
      success: true,
      data: {
        ...announcement.toObject(),
        commentCount
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error fetching announcement',
      error: error.message
    };
  }
};

/**
 * Get announcements for a society with filters
 */
export const getSocietyAnnouncements = async (societyId, filters = {}) => {
  try {
    const { page = 1, limit = 10, category, priority, search, status = 'published', pinned, sortBy = 'latest', userId = null } = filters;

    const skip = (page - 1) * limit;
    const query = { societyId };

    // Apply filters
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (pinned !== undefined) query.isPinned = pinned === 'true';
    if (status) query.status = status;

    // Search functionality
    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }, { tags: { $regex: search, $options: 'i' } }];
    }

    // Filter out expired announcements for non-admins
    if (status === 'published') {
      query.$or = [{ expiryDate: { $exists: false } }, { expiryDate: { $gt: new Date() } }];
      query.isPublished = true;
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdOn: 1 };
        break;
      case 'most_viewed':
        sort = { viewCount: -1, createdOn: -1 };
        break;
      case 'priority':
        sort = {
          priority: -1,
          isPinned: -1,
          createdOn: -1
        };
        break;
      default: // 'latest'
        sort = { isPinned: -1, createdOn: -1 };
    }

    // Get total count
    const total = await Announcement.countDocuments(query);

    // Get announcements
    const announcements = await Announcement.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate('createdByUserId').lean();

    // Get comment counts for each announcement
    if (announcements.length > 0) {
      const announcementIds = announcements.map((a) => a._id);

      const commentCounts = await Comment.aggregate([
        {
          $match: {
            announcementId: { $in: announcementIds },
            isDeleted: false,
            isHidden: false
          }
        },
        {
          $group: {
            _id: '$announcementId',
            count: { $sum: 1 }
          }
        }
      ]);

      // Map comment counts to announcements
      const commentCountMap = commentCounts.reduce((map, item) => {
        map[item._id.toString()] = item.count;
        return map;
      }, {});

      announcements.forEach((announcement) => {
        announcement.commentCount = commentCountMap[announcement._id.toString()] || 0;

        // Check if user has viewed each announcement
        if (userId) {
          announcement.hasViewed = announcement.views.some((view) => view.userId.toString() === userId.toString());
        }
      });
    }

    return {
      success: true,
      data: {
        announcements,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error fetching announcements',
      error: error.message
    };
  }
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (id, updates, userId) => {
  try {
    // Don't allow changing certain fields
    const restrictedFields = ['createdByUserId', 'societyId', 'views', 'viewCount'];
    restrictedFields.forEach((field) => delete updates[field]);

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return {
        success: false,
        message: 'Announcement not found',
        code: 404
      };
    }

    // Check permissions
    if (announcement.createdByUserId.toString() !== userId.toString()) {
      // Verify if user has admin privileges (you'll need to implement this check)
      const isAdmin = true; // Replace with actual admin check
      if (!isAdmin) {
        return {
          success: false,
          message: 'You do not have permission to update this announcement',
          code: 403
        };
      }
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      announcement[key] = updates[key];
    });

    announcement.isEdited = true;
    await announcement.save();

    const populated = await announcement.populate('createdByUserId');

    return {
      success: true,
      data: populated,
      message: 'Announcement updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error updating announcement',
      error: error.message
    };
  }
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (id, userId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const announcement = await Announcement.findById(id).session(session);

    if (!announcement) {
      return {
        success: false,
        message: 'Announcement not found',
        code: 404
      };
    }

    // Check permissions
    if (announcement.createdByUserId.toString() !== userId.toString()) {
      const isAdmin = true; // Replace with actual admin check
      if (!isAdmin) {
        return {
          success: false,
          message: 'You do not have permission to delete this announcement',
          code: 403
        };
      }
    }

    // Delete announcement
    await Announcement.findByIdAndDelete(id).session(session);

    // Delete associated comments
    await Comment.deleteMany({ announcementId: id }).session(session);

    await session.commitTransaction();

    return {
      success: true,
      message: 'Announcement deleted successfully'
    };
  } catch (error) {
    await session.abortTransaction();
    return {
      success: false,
      message: 'Error deleting announcement',
      error: error.message
    };
  } finally {
    session.endSession();
  }
};

/**
 * Toggle pin status
 */
export const togglePinAnnouncement = async (id, userId) => {
  try {
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return {
        success: false,
        message: 'Announcement not found',
        code: 404
      };
    }

    // Check admin permissions
    const isAdmin = true; // Replace with actual admin check
    if (!isAdmin) {
      return {
        success: false,
        message: 'Only admins can pin/unpin announcements',
        code: 403
      };
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    return {
      success: true,
      data: {
        isPinned: announcement.isPinned
      },
      message: `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error toggling pin status',
      error: error.message
    };
  }
};

/**
 * Get announcement statistics
 */
export const getAnnouncementStats = async (societyId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Announcement.aggregate([
      { $match: { societyId: mongoose.Types.ObjectId(societyId) } },
      {
        $facet: {
          // Overall stats
          overview: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                published: {
                  $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
                },
                drafts: {
                  $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
                },
                pinned: {
                  $sum: { $cond: ['$isPinned', 1, 0] }
                },
                totalViews: { $sum: '$viewCount' },
                avgViews: { $avg: '$viewCount' }
              }
            }
          ],

          // By category
          byCategory: [{ $match: { status: 'published' } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],

          // By priority
          byPriority: [{ $match: { status: 'published' } }, { $group: { _id: '$priority', count: { $sum: 1 } } }, { $sort: { count: -1 } }],

          // Monthly trend
          monthlyTrend: [
            { $match: { createdOn: { $gte: thirtyDaysAgo } } },
            {
              $group: {
                _id: {
                  year: { $year: '$createdOn' },
                  month: { $month: '$createdOn' },
                  day: { $dayOfMonth: '$createdOn' }
                },
                count: { $sum: 1 },
                views: { $sum: '$viewCount' }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $limit: 30 }
          ],

          // Top announcements
          topAnnouncements: [
            { $match: { status: 'published' } },
            { $sort: { viewCount: -1 } },
            { $limit: 10 },
            {
              $project: {
                title: 1,
                viewCount: 1,
                commentCount: 1,
                category: 1,
                priority: 1,
                createdOn: 1
              }
            }
          ],

          // Recent activity
          recentActivity: [
            { $sort: { updatedAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                title: 1,
                status: 1,
                updatedAt: 1,
                updatedBy: 1
              }
            }
          ]
        }
      }
    ]);

    // Format monthly trend data
    const formattedStats = stats[0];

    if (formattedStats.monthlyTrend) {
      formattedStats.monthlyTrend = formattedStats.monthlyTrend.map((item) => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
        announcements: item.count,
        views: item.views
      }));
    }

    return {
      success: true,
      data: formattedStats
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    };
  }
};

/**
 * Search announcements
 */
export const searchAnnouncements = async (societyId, searchTerm, options = {}) => {
  try {
    const { page = 1, limit = 20, fields = ['title', 'content', 'tags'] } = options;

    const skip = (page - 1) * limit;
    const query = { societyId, status: 'published', isPublished: true };

    // Build search query
    if (searchTerm && fields.length > 0) {
      const searchConditions = fields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' }
      }));
      query.$or = searchConditions;
    }

    const total = await Announcement.countDocuments(query);

    const announcements = await Announcement.find(query).sort({ isPinned: -1, createdOn: -1 }).skip(skip).limit(parseInt(limit)).populate('createdByUserId').lean();

    return {
      success: true,
      data: {
        announcements,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error searching announcements',
      error: error.message
    };
  }
};

/**
 * Get announcements by category
 */
export const getAnnouncementsByCategory = async (societyId, category, options = {}) => {
  return getSocietyAnnouncements(societyId, {
    ...options,
    category
  });
};

/**
 * Get announcements by priority
 */
export const getAnnouncementsByPriority = async (societyId, priority, options = {}) => {
  return getSocietyAnnouncements(societyId, {
    ...options,
    priority
  });
};

/**
 * Bulk update announcements
 */
export const bulkUpdateAnnouncements = async (ids, updates, userId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check permissions for all announcements
    const announcements = await Announcement.find({
      _id: { $in: ids }
    }).session(session);

    if (announcements.length !== ids.length) {
      return {
        success: false,
        message: 'Some announcements not found',
        code: 404
      };
    }

    // Update all announcements
    const result = await Announcement.updateMany({ _id: { $in: ids } }, { ...updates, updatedAt: new Date() }, { session });

    await session.commitTransaction();

    return {
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      },
      message: 'Announcements updated successfully'
    };
  } catch (error) {
    await session.abortTransaction();
    return {
      success: false,
      message: 'Error updating announcements',
      error: error.message
    };
  } finally {
    session.endSession();
  }
};

/**
 * Export announcements to CSV/JSON
 */
export const exportAnnouncements = async (societyId, format = 'json') => {
  try {
    const announcements = await Announcement.find({ societyId }).populate('createdByUserId').sort({ createdOn: -1 }).lean();

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(announcements);
      return {
        success: true,
        data: csvData,
        format: 'csv'
      };
    }

    // Default to JSON
    return {
      success: true,
      data: announcements,
      format: 'json'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error exporting announcements',
      error: error.message
    };
  }
};

/**
 * Convert announcements to CSV
 */
const convertToCSV = (announcements) => {
  if (announcements.length === 0) return '';

  const headers = ['Title', 'Content', 'Category', 'Priority', 'Status', 'Created At', 'Created By', 'View Count', 'Comment Count', 'Is Pinned'].join(',');

  const rows = announcements.map((announcement) =>
    [
      `"${(announcement.title || '').replace(/"/g, '""')}"`,
      `"${(announcement.content || '').replace(/"/g, '""')}"`,
      announcement.category,
      announcement.priority,
      announcement.status,
      new Date(announcement.createdOn).toISOString(),
      announcement.createdByUserId?.name || '',
      announcement.viewCount,
      announcement.commentCount || 0,
      announcement.isPinned ? 'Yes' : 'No'
    ].join(',')
  );

  return [headers, ...rows].join('\n');
};

/**
 * Publish an announcement (change status from draft to published)
 */
export const publishAnnouncement = async (id, userId) => {
  try {
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return {
        success: false,
        message: 'Announcement not found',
        code: 404
      };
    }

    // Check if announcement is already published
    if (announcement.status === 'published' && announcement.isPublished) {
      return {
        success: false,
        message: 'Announcement is already published',
        code: 400
      };
    }

    // Check permissions (only admin/manager or creator can publish)
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager';

    if (announcement.createdBy.toString() !== userId.toString() && !isAdmin) {
      return {
        success: false,
        message: 'You do not have permission to publish this announcement',
        code: 403
      };
    }

    // Update announcement status
    announcement.status = 'published';
    announcement.isPublished = true;
    announcement.publishDate = announcement.publishDate || new Date();

    // If expiry date is in the past, set it to future
    if (announcement.expiryDate && announcement.expiryDate <= new Date()) {
      // Set expiry to 7 days from now by default
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      announcement.expiryDate = defaultExpiry;
    }

    await announcement.save();

    const populated = await announcement.populate('createdBy', 'name email profilePicture');

    return {
      success: true,
      data: populated,
      message: 'Announcement published successfully'
    };
  } catch (error) {
    next(error);
  }
};

/**
 * Unpublish an announcement (change status from published to draft)
 */
export const unpublishAnnouncement = async (id, userId) => {
  try {
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return {
        success: false,
        message: 'Announcement not found',
        code: 404
      };
    }

    // Check if announcement is already unpublished
    if (announcement.status === 'draft' && !announcement.isPublished) {
      return {
        success: false,
        message: 'Announcement is already unpublished',
        code: 400
      };
    }

    // Check permissions (only admin/manager or creator can unpublish)
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager';

    if (announcement.createdBy.toString() !== userId.toString() && !isAdmin) {
      return {
        success: false,
        message: 'You do not have permission to unpublish this announcement',
        code: 403
      };
    }

    // Update announcement status
    announcement.status = 'draft';
    announcement.isPublished = false;
    await announcement.save();

    const populated = await announcement.populate('createdBy', 'name email profilePicture');

    return {
      success: true,
      data: populated,
      message: 'Announcement unpublished successfully'
    };
  } catch (error) {
    next(error);
  }
};

module.exports = new AnnouncementService();
