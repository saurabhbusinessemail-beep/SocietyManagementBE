const mongoose = require('mongoose');

/**
 * ChatRoom Model
 * Represents a chat group/room in the system.
 *
 * Room Types:
 * - society_owners_tenants   : Owners & Tenants
 * - society_owners           : Owners Only
 * - society_owners_managers  : Owners and Managers
 * - society_managers_owners_tenants : Managers, Owners and Tenants
 * - society_security         : Security (Only for society securities, admins, managers)
 * - society_all              : All Members
 * - building_all             : AllMembers in building
 * - building_owners_admins   : Owners & Building Admins
 * - flat_owner_members       : Owner & Members
 * - flat_owner_tenants       : Owner & Tenants
 * - flat_tenants             : Tenants & Tenant Members
 * - personal                 : One-to-one chat between two users
 */
const chatRoomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'society_owners_tenants',
        'society_owners',
        'society_owners_managers',
        'society_managers_owners_tenants',
        'society_security',
        'society_all',
        'building_all',
        'building_owners_admins',
        'flat_owner_members',
        'flat_owner_tenants',
        'flat_tenants',
        'personal'
      ],
      required: true,
      index: true
    },
    name: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    // References
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      index: true
    },
    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      index: true
    },
    // For personal chats: the two participants
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        // Blocked by this participant (for personal chats)
        isBlocked: {
          type: Boolean,
          default: false
        },
        blockedAt: Date,
        // Last read message timestamp for this participant
        lastReadAt: {
          type: Date,
          default: null
        },
        // Last seen message id
        lastReadMessageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ChatMessage',
          default: null
        }
      }
    ],
    // Last message snapshot for list display
    lastMessage: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
      },
      content: String,
      type: { type: String },
      sentAt: Date,
      sentByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      senderName: String
    },
    // Message count
    messageCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Room icon/avatar (optional custom)
    avatar: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance
chatRoomSchema.index({ societyId: 1, type: 1 });
chatRoomSchema.index({ societyId: 1, buildingId: 1, type: 1 });
chatRoomSchema.index({ societyId: 1, flatId: 1, type: 1 });
chatRoomSchema.index({ 'participants.userId': 1, type: 1 });
chatRoomSchema.index({ societyId: 1, type: 1, 'participants.userId': 1 });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
