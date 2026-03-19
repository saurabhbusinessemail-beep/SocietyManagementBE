import { Announcement, Comments, User, SocietyPlan } from '../models';
import { checkFeatureAccess } from './planCache.service';
import { FEATURES } from '../config/features';
const mongoose = require('mongoose');

/**
 * Create a new announcement
 */
export const createAnnouncement = async (data) => {
  // Check feature access
  const featureCheck = await checkFeatureAccess(data.societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  const announcement = new Announcement({
    ...data,
    status: data.status || 'published'
  });

  await announcement.save();

  // Populate creator info
  const populated = await announcement.populate('createdByUserId');

  return populated;
};

/**
 * Get announcement by ID
 */
export const getAnnouncementById = async (id, userId = null) => {
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
    return null;
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(announcement.societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
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
  const commentCount = await Comments.countDocuments({
    announcementId: id,
    isDeleted: false,
    isHidden: false
  });

  return {
    ...announcement.toObject(),
    commentCount
  };
};

/**
 * Get announcements for a society with filters
 */
export const getSocietyAnnouncements = async (societyId, filters = {}) => {
  // Check feature access
  const featureCheck = await checkFeatureAccess(societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  const { page = 1, limit = 10, category, priority, search, status, pinned, sortBy = 'latest', userId = null } = filters;

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
  const data = await Announcement.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate('createdByUserId').populate('societyId').lean();

  // Get comment counts for each announcement
  if (data.length > 0) {
    const announcementIds = data.map((a) => a._id);

    const commentCounts = await Comments.aggregate([
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

    data.forEach((announcement) => {
      announcement.commentCount = commentCountMap[announcement._id.toString()] || 0;

      // Check if user has viewed each announcement
      if (userId) {
        announcement.hasViewed = announcement.views.some((view) => view.userId.toString() === userId.toString());
      }
    });
  }

  return {
    data,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    success: true
  };
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (id, updates, userId) => {
  // Don't allow changing certain fields
  const restrictedFields = ['createdByUserId', 'societyId', 'views', 'viewCount'];
  restrictedFields.forEach((field) => delete updates[field]);

  const announcement = await Announcement.findById(id);

  if (!announcement) {
    return null;
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(announcement.societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  // Check permissions
  if (announcement.createdByUserId.toString() !== userId.toString()) {
    // Verify if user has admin privileges (you'll need to implement this check)
    const isAdmin = true; // Replace with actual admin check
    if (!isAdmin) {
      throw new Error('You do not have permission to update this announcement');
    }
  }

  // Apply updates
  Object.keys(updates).forEach((key) => {
    announcement[key] = updates[key];
  });

  announcement.isEdited = true;
  await announcement.save();

  const populated = await announcement.populate('createdByUserId');
  return populated;
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (id, userId) => {
  const announcement = await Announcement.findById(id);

  if (!announcement) {
    return null;
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(announcement.societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  // Check permissions
  if (announcement.createdByUserId.toString() !== userId.toString()) {
    const isAdmin = true; // Replace with actual admin check;
    if (!isAdmin) {
      throw new Error('You do not have permission to delete this announcement');
    }
  }

  // Delete announcement
  await Announcement.findByIdAndDelete(id);

  // Delete associated comments
  await Comments.deleteMany({ announcementId: id });

  return { success: true };
};

/**
 * Toggle pin status
 */
export const togglePinAnnouncement = async (id, userId) => {
  const announcement = await Announcement.findById(id);

  if (!announcement) {
    return null;
  }

  // Check announcements feature
  const announcementsCheck = await checkFeatureAccess(announcement.societyId, FEATURES.ANNOUNCEMENTS);
  if (!announcementsCheck.allowed) {
    throw new Error(announcementsCheck.reason);
  }

  // Check admin permissions
  const isAdmin = true; // Replace with actual admin check
  if (!isAdmin) {
    throw new Error('Only admins can pin/unpin announcements');
  }

  announcement.isPinned = !announcement.isPinned;
  await announcement.save();

  return {
    isPinned: announcement.isPinned
  };
};

/**
 * Get announcement statistics
 */
export const getAnnouncementStats = async (societyId) => {
  // Check announcements feature
  const announcementsCheck = await checkFeatureAccess(societyId, FEATURES.ANNOUNCEMENTS);
  if (!announcementsCheck.allowed) {
    throw new Error(announcementsCheck.reason);
  }

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

  return formattedStats;
};

/**
 * Search announcements
 */
export const searchAnnouncements = async (societyId, searchTerm, options = {}) => {
  // Check feature access
  const featureCheck = await checkFeatureAccess(societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  const { page = 1, limit = 20, fields = ['title', 'content', 'tags'] } = options;

  const skip = (page - 1) * limit;
  const query = { societyId, status: 'published', isPublished: true };

  if (searchTerm && fields.length > 0) {
    const searchConditions = fields.map((field) => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }));
    query.$or = searchConditions;
  }

  const total = await Announcement.countDocuments(query);

  const data = await Announcement.find(query).sort({ isPinned: -1, createdOn: -1 }).skip(skip).limit(parseInt(limit)).populate('createdByUserId').lean();

  return {
    data,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    success: true
  };
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
  if (!ids || ids.length === 0) {
    throw new Error('No announcement IDs provided');
  }

  // Get first announcement to check society
  const firstAnnouncement = await Announcement.findById(ids[0]);
  if (!firstAnnouncement) {
    throw new Error('Announcement not found');
  }

  // Check announcements feature
  const announcementsCheck = await checkFeatureAccess(firstAnnouncement.societyId, FEATURES.ANNOUNCEMENTS);
  if (!announcementsCheck.allowed) {
    throw new Error(announcementsCheck.reason);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const announcements = await Announcement.find({
      _id: { $in: ids }
    }).session(session);

    if (announcements.length !== ids.length) {
      throw new Error('Some announcements not found');
    }

    const result = await Announcement.updateMany({ _id: { $in: ids } }, { ...updates, updatedAt: new Date() }, { session });

    await session.commitTransaction();

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    };
  } finally {
    session.endSession();
  }
};

/**
 * Export announcements to CSV/JSON
 */
export const exportAnnouncements = async (societyId, format = 'json') => {
  // Check announcements feature
  const announcementsCheck = await checkFeatureAccess(societyId, FEATURES.ANNOUNCEMENTS);
  if (!announcementsCheck.allowed) {
    throw new Error(announcementsCheck.reason);
  }

  const data = await Announcement.find({ societyId }).populate('createdByUserId').sort({ createdOn: -1 }).lean();

  if (format === 'csv') {
    const csvData = convertToCSV(data);
    return csvData;
  }

  return data;
};

/**
 * Convert announcements to CSV
 */
const convertToCSV = (announcements) => {
  if (announcements.length === 0) return '';

  const headers = ['Title', 'Content', 'Category', 'Priority', 'Status', 'Created At', 'Created By', 'View Count', 'Comments Count', 'Is Pinned'].join(',');

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
 * Publish an announcement
 */
export const publishAnnouncement = async (id, userId) => {
  const announcement = await Announcement.findById(id);

  if (!announcement) {
    return null;
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(announcement.societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  if (announcement.status === 'published' && announcement.isPublished) {
    throw new Error('Announcement is already published');
  }

  const user = await User.findById(userId);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager';

  if (announcement.createdByUserId?.toString() !== userId.toString() && !isAdmin) {
    throw new Error('You do not have permission to publish this announcement');
  }

  announcement.status = 'published';
  announcement.isPublished = true;
  announcement.publishDate = announcement.publishDate || new Date();

  if (announcement.expiryDate && announcement.expiryDate <= new Date()) {
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    announcement.expiryDate = defaultExpiry;
  }

  await announcement.save();

  const populated = await announcement.populate('createdByUserId');
  return populated;
};

/**
 * Unpublish an announcement
 */
export const unpublishAnnouncement = async (id, userId) => {
  const announcement = await Announcement.findById(id);

  if (!announcement) {
    return null;
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(announcement.societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  if (announcement.status === 'draft' && !announcement.isPublished) {
    throw new Error('Announcement is already unpublished');
  }

  const user = await User.findById(userId);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager';

  if (announcement.createdByUserId?.toString() !== userId.toString() && !isAdmin) {
    throw new Error('You do not have permission to unpublish this announcement');
  }

  announcement.status = 'draft';
  announcement.isPublished = false;
  await announcement.save();

  const populated = await announcement.populate('createdByUserId');
  return populated;
};

/**
 * Track view for an announcement
 */
export const trackView = async (announcementId, userId, userInfo = {}) => {
  const announcement = await Announcement.findById(announcementId);

  if (!announcement) {
    return null;
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(announcement.societyId, FEATURES.ANNOUNCEMENTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  const existingView = announcement.views.find((view) => view.userId.toString() === userId.toString());

  if (existingView) {
    existingView.viewedAt = new Date();
    existingView.viewCount = (existingView.viewCount || 1) + 1;
  } else {
    announcement.views.push({
      userId,
      ...userInfo,
      viewedAt: new Date(),
      viewCount: 1
    });
    announcement.viewCount += 1;
  }

  announcement.lastViewedAt = new Date();
  await announcement.save();

  return {
    viewCount: announcement.viewCount,
    hasViewed: true,
    lastViewedAt: announcement.lastViewedAt
  };
};