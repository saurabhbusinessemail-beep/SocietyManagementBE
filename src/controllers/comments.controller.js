const Comment = require('../models/comments.model');
const Announcement = require('../models/announcement.model');

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { announcementId, content, parentCommentId, attachments } = req.body;

    // Check if announcement exists and comments are enabled
    const announcement = await Announcement.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (!announcement.commentsEnabled) {
      return res.status(403).json({ message: 'Comments are disabled for this announcement' });
    }

    const comment = new Comment({
      announcementId,
      userId: req.user.id,
      content,
      parentCommentId: parentCommentId || null,
      attachments: attachments || [],
      userAgent: req.headers['user-agent']
      // Note: ipAddress should be handled carefully for privacy
    });

    await comment.save();

    // Populate user info for response
    const populatedComment = await Comment.findById(comment._id).populate('userId', 'name profilePicture');

    // Increment announcement engagement metric (optional)
    await Announcement.findByIdAndUpdate(announcementId, {
      $inc: { commentCount: 1 }
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
};

// Get comments for an announcement
export const getComments = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { page = 1, limit = 20, sortBy = 'newest', includeReplies = false } = req.query;

    const result = await Comment.getCommentsForAnnouncement(announcementId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      includeReplies: includeReplies === 'true',
      userId: req.user.id
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

// Get comment tree (nested structure)
export const getCommentTree = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { maxDepth = 3 } = req.query;

    const comments = await Comment.getCommentTree(announcementId, parseInt(maxDepth));

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comment tree', error: error.message });
  }
};

// Update comment
export const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    // Add to edit history
    if (!comment.editHistory) {
      comment.editHistory = [];
    }

    comment.editHistory.push({
      content: comment.content,
      editedAt: new Date(),
      reason: 'User edit'
    });

    // Update comment
    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    const updatedComment = await Comment.findById(commentId).populate('userId', 'name profilePicture');

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating comment', error: error.message });
  }
};

// Delete comment (soft delete)
export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { reason } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is owner or admin
    const isOwner = comment.userId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'Only comment owner or admin can delete comments'
      });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.deletedBy = req.user.id;
    comment.content = '[This comment has been deleted]';
    comment.attachments = [];
    await comment.save();

    // Decrement announcement comment count
    await Announcement.findByIdAndUpdate(comment.announcementId, {
      $inc: { commentCount: -1 }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

// Like/unlike a comment
export const toggleLike = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { reactionType = 'like' } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await comment.toggleLike(req.user.id, reactionType);

    res.json({
      message: 'Reaction updated successfully',
      likeCount: comment.likeCount,
      hasLiked: comment.hasLiked(req.user.id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating reaction', error: error.message });
  }
};

// Report a comment
export const reportComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { reason, description } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user has already reported
    const existingReport = comment.reports.find((report) => report.userId.toString() === req.user.id);

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this comment' });
    }

    // Add report
    comment.reports.push({
      userId: req.user.id,
      reason,
      description
    });

    comment.reportCount += 1;
    await comment.save();

    res.json({ message: 'Comment reported successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reporting comment', error: error.message });
  }
};

// Admin: Pin/unpin comment
export const togglePinComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.isPinned = !comment.isPinned;

    if (comment.isPinned) {
      comment.pinnedBy = req.user.id;
      comment.pinnedAt = new Date();
    } else {
      comment.pinnedBy = null;
      comment.pinnedAt = null;
    }

    await comment.save();

    res.json({
      message: `Comment ${comment.isPinned ? 'pinned' : 'unpinned'} successfully`,
      isPinned: comment.isPinned
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling pin status', error: error.message });
  }
};

// Admin: Hide/unhide comment
export const toggleHideComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { reason } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.isHidden = !comment.isHidden;

    if (comment.isHidden) {
      comment.hiddenBy = req.user.id;
      comment.hiddenAt = new Date();
      comment.hiddenReason = reason;
    } else {
      comment.hiddenBy = null;
      comment.hiddenAt = null;
      comment.hiddenReason = '';
    }

    await comment.save();

    res.json({
      message: `Comment ${comment.isHidden ? 'hidden' : 'unhidden'} successfully`,
      isHidden: comment.isHidden
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling hide status', error: error.message });
  }
};

// Get comment statistics (Admin only)
export const getCommentStats = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const stats = await Comment.aggregate([
      { $match: { announcementId: mongoose.Types.ObjectId(announcementId) } },
      {
        $facet: {
          totalComments: [{ $count: 'count' }],
          topCommenters: [{ $group: { _id: '$userId', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }],
          commentsByHour: [
            {
              $group: {
                _id: { $hour: '$createdAt' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          reportsSummary: [
            { $unwind: '$reports' },
            {
              $group: {
                _id: '$reports.reason',
                count: { $sum: 1 }
              }
            }
          ],
          averageLikes: [
            {
              $group: {
                _id: null,
                avgLikes: { $avg: '$likeCount' },
                maxLikes: { $max: '$likeCount' }
              }
            }
          ]
        }
      }
    ]);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comment statistics', error: error.message });
  }
};
