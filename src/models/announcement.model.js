const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['general', 'maintenance', 'event', 'security', 'billing', 'other'],
      default: 'general'
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isPublished: {
      type: Boolean,
      default: false
    },
    publishDate: {
      type: Date
    },
    expiryDate: {
      type: Date,
      // validate: {
      //   validator: function (value) {
      //     return !value || value > this.publishDate;
      //   },
      //   message: 'Expiry date must be after publish date'
      // }
    },
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        viewedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    viewCount: {
      type: Number,
      default: 0
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },
    commentsEnabled: {
      type: Boolean,
      default: false
    },

    ...require('./default-fields.model')
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for comments
announcementSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'announcementId',
  options: { sort: { createdOn: -1 } }
});

// Indexes for better query performance
announcementSchema.index({ societyId: 1, publishDate: -1 });
announcementSchema.index({ societyId: 1, isPinned: -1, publishDate: -1 });
announcementSchema.index({ societyId: 1, status: 1 });
announcementSchema.index({ societyId: 1, category: 1 });
// announcementSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired announcements

// Method to check if announcement is active
announcementSchema.methods.isActive = function () {
  const now = new Date();
  if (!this.isPublished || this.status !== 'published') return false;
  if (this.expiryDate && this.expiryDate < now) return false;
  return true;
};

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = function (societyId, options = {}) {
  const now = new Date();
  const query = {
    societyId,
    isPublished: true,
    status: 'published',
    $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gt: now } }]
  };

  if (options.category) {
    query.category = options.category;
  }

  if (options.priority) {
    query.priority = options.priority;
  }

  return this.find(query)
    .sort({ isPinned: -1, publishDate: -1 })
    .populate('createdByUserId')
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

announcementSchema.add({
  commentCount: {
    type: Number,
    default: 0
  }
});

// Also update the virtual populate:
announcementSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'announcementId',
  options: {
    sort: { isPinned: -1, createdOn: -1 },
    match: { isDeleted: false, isHidden: false }
  }
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
