const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement',
      required: [true, 'Announcement reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true
    },
    // For nested comments/replies
    isReply: {
      type: Boolean,
      default: false
    },
    // To track if comment has been edited
    isEdited: {
      type: Boolean,
      default: false
    },
    // For editing history (optional)
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now
        },
        reason: String
      }
    ],
    // Likes/Reactions system
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reactedAt: {
          type: Date,
          default: Date.now
        },
        reactionType: {
          type: String,
          enum: ['like', 'love', 'helpful', 'agree', 'disagree'],
          default: 'like'
        }
      }
    ],
    // Like count for quick access (denormalized)
    likeCount: {
      type: Number,
      default: 0
    },
    // Report/Moderation system
    reports: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reason: {
          type: String,
          enum: ['spam', 'abuse', 'offensive', 'off_topic', 'other']
        },
        description: String,
        reportedAt: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ['pending', 'reviewed', 'dismissed'],
          default: 'pending'
        }
      }
    ],
    reportCount: {
      type: Number,
      default: 0
    },
    // Moderation flags
    isHidden: {
      type: Boolean,
      default: false
    },
    hiddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hiddenAt: Date,
    hiddenReason: String,
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Pinned comment feature (admin can pin important comments)
    isPinned: {
      type: Boolean,
      default: false
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: Date,
    // For sorting by popularity/engagement
    engagementScore: {
      type: Number,
      default: 0,
      index: true
    },
    // Metadata
    userAgent: String, // Browser/device info
    ipAddress: String, // For moderation (store hashed)
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        thumbnailUrl: String,
        fileSize: Number,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // For comment threading level
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 5 // Limit nesting depth
    },
    // Path for efficient nested querying (Materialized Path pattern)
    path: {
      type: String,
      default: '',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for nested replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId',
  options: { sort: { createdAt: 1 } } // Oldest first for replies
});

// Virtual for user info (alternative to population)
commentSchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Indexes for better query performance
commentSchema.index({ announcementId: 1, createdAt: -1 });
commentSchema.index({ announcementId: 1, isPinned: -1, createdAt: -1 });
commentSchema.index({ announcementId: 1, likeCount: -1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, createdAt: 1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ 'likes.userId': 1 });
commentSchema.index({ path: 1 }); // For nested comment queries

// Pre-save middleware to update path for nested comments
commentSchema.pre('save', async function (next) {
  if (this.parentCommentId && this.isNew) {
    // Calculate depth and path
    const parent = await this.constructor.findById(this.parentCommentId);
    if (parent) {
      this.depth = parent.depth + 1;
      this.path = parent.path ? `${parent.path}.${parent._id}` : parent._id.toString();
      this.isReply = true;
    }
  }
  next();
});

// Method to check if user has liked the comment
commentSchema.methods.hasLiked = function (userId) {
  return this.likes.some((like) => like.userId.toString() === userId.toString());
};

// Method to add/remove like
commentSchema.methods.toggleLike = async function (userId, reactionType = 'like') {
  const existingLikeIndex = this.likes.findIndex((like) => like.userId.toString() === userId.toString());

  if (existingLikeIndex > -1) {
    // Remove like
    this.likes.splice(existingLikeIndex, 1);
    this.likeCount = Math.max(0, this.likeCount - 1);
  } else {
    // Add like
    this.likes.push({
      userId,
      reactionType
    });
    this.likeCount += 1;
  }

  // Update engagement score
  this.engagementScore = this.calculateEngagementScore();

  return this.save();
};

// Method to calculate engagement score
commentSchema.methods.calculateEngagementScore = function () {
  const likeWeight = 1;
  const replyWeight = 2; // Replies are more valuable
  const timeWeight = 0.1; // Recency factor

  const hoursSinceCreation = (Date.now() - this.createdAt) / (1000 * 60 * 60);

  // Base score with time decay
  let score = this.likeCount * likeWeight + this.reportCount * -5;
  score *= Math.exp((-timeWeight * hoursSinceCreation) / 24); // Decay over days

  return Math.round(score * 100) / 100;
};

// Static method to get comments for an announcement with pagination
commentSchema.statics.getCommentsForAnnouncement = async function (announcementId, options = {}) {
  const {
    page = 1,
    limit = 50,
    sortBy = 'newest', // 'newest', 'oldest', 'popular', 'controversial'
    includeReplies = false,
    userId = null // For checking user's likes
  } = options;

  const skip = (page - 1) * limit;

  // Build sort object
  let sort = {};
  switch (sortBy) {
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'popular':
      sort = { likeCount: -1, createdAt: -1 };
      break;
    case 'controversial':
      sort = { reportCount: -1, likeCount: -1 };
      break;
    default: // 'newest'
      sort = { isPinned: -1, createdAt: -1 };
  }

  // Build query
  const query = {
    announcementId,
    isDeleted: false,
    isHidden: false
  };

  // If not including replies, only get top-level comments
  if (!includeReplies) {
    query.parentCommentId = null;
    query.depth = 0;
  }

  // Get total count
  const total = await this.countDocuments(query);

  // Get comments
  const comments = await this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name email profilePicture role')
    .populate('pinnedBy', 'name')
    .populate({
      path: 'replies',
      match: { isDeleted: false, isHidden: false },
      options: { sort: { createdAt: 1 }, limit: 5 },
      populate: {
        path: 'userId',
        select: 'name profilePicture'
      }
    });

  // Check if user has liked each comment
  if (userId) {
    const userLikedComments = await this.find({
      _id: { $in: comments.map((c) => c._id) },
      'likes.userId': userId
    }).select('_id');

    const likedCommentIds = new Set(userLikedComments.map((c) => c._id.toString()));

    comments.forEach((comment) => {
      comment._doc.hasLiked = likedCommentIds.has(comment._id.toString());
    });
  }

  return {
    comments,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    }
  };
};

// Static method to get comment tree (nested structure)
commentSchema.statics.getCommentTree = async function (announcementId, maxDepth = 3) {
  // Get all comments for this announcement
  const allComments = await this.find({
    announcementId,
    isDeleted: false,
    isHidden: false,
    depth: { $lte: maxDepth }
  })
    .sort({ path: 1, createdAt: 1 })
    .populate('userId', 'name profilePicture')
    .lean();

  // Build tree structure
  const commentMap = {};
  const rootComments = [];

  allComments.forEach((comment) => {
    comment.replies = [];
    commentMap[comment._id] = comment;

    if (!comment.parentCommentId) {
      rootComments.push(comment);
    } else if (commentMap[comment.parentCommentId]) {
      commentMap[comment.parentCommentId].replies.push(comment);
    }
  });

  return rootComments;
};

// Static method to soft delete comment and its replies
commentSchema.statics.softDeleteComment = async function (commentId, deletedBy, reason = '') {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Get the comment and all its nested replies using path
    const comment = await this.findById(commentId).session(session);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Build path pattern to find all nested replies
    const pathPattern = comment.path ? `${comment.path}.${comment._id}` : comment._id.toString();

    const regexPattern = new RegExp(`^${pathPattern}`);

    // Find all comments in this thread
    const commentsToDelete = await this.find({
      $or: [{ _id: commentId }, { path: regexPattern }]
    }).session(session);

    // Soft delete all comments in thread
    const deletePromises = commentsToDelete.map((c) =>
      this.findByIdAndUpdate(
        c._id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy,
          content: '[This comment has been deleted]',
          attachments: [],
          likes: [],
          likeCount: 0
        },
        { session }
      )
    );

    await Promise.all(deletePromises);
    await session.commitTransaction();

    return {
      success: true,
      deletedCount: commentsToDelete.length
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Pre-remove hook to delete nested replies
commentSchema.pre('remove', async function (next) {
  // Find and delete all replies when a comment is permanently deleted
  await this.model('Comment').deleteMany({
    parentCommentId: this._id
  });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
