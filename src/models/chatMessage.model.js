const mongoose = require('mongoose');

/**
 * ChatMessage Model
 * Represents individual messages in chat rooms.
 */
const chatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true
    },
    // Sender
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderName: {
      type: String,
      trim: true
    },
    senderSubtitle: {
      type: String,
      trim: true
    },
    // Message content
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'document', 'location', 'audio'],
      default: 'text'
    },
    content: {
      type: String,
      trim: true
    },
    // For media messages
    media: {
      url: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      thumbnail: String, // for video
      duration: Number   // for audio/video
    },
    // For location messages
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      placeName: String
    },
    // Reply to a previous message
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
      },
      content: String,
      type: { type: String },
      senderName: String,
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    // Delivery & Read receipts
    deliveredTo: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        deliveredAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // Deletion tracking
    isDeletedForEveryone: {
      type: Boolean,
      default: false
    },
    deletedForEveryone: {
      deletedAt: Date,
      deletedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    // Users who deleted this message for themselves only
    deletedForUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
    },
    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    // Sent timestamp (explicit, separate from createdAt)
    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
chatMessageSchema.index({ roomId: 1, sentAt: -1 });
chatMessageSchema.index({ roomId: 1, isDeleted: 1, isDeletedForEveryone: 1, sentAt: -1 });
chatMessageSchema.index({ senderId: 1, roomId: 1 });
chatMessageSchema.index({ societyId: 1, content: 'text' }); // text search

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
