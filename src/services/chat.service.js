import { ChatRoom, ChatMessage, Flat, FlatMember, Building, Society, User } from '../models';
import { checkFeatureAccess } from './planCache.service';
import { FEATURES } from '../config/features';
const mongoose = require('mongoose');

/**
 * Get all chat rooms accessible to a user for given society(ies)
 * A user sees a room only if they are a participant (for personal) or
 * their membership qualifies (for group rooms).
 */
export const getUserChatRooms = async (userId, filters = {}) => {
  try {
    const { societyId, flatId, type } = filters;

    const membershipQuery = { userId, isDeleted: { $ne: true } };
    if (societyId) membershipQuery.societyId = societyId;

    const userFlatMemberships = await FlatMember.find(membershipQuery).lean();

    const conditions = [];
    
    if (societyId) {
      // 1. Personal rooms within this society
      conditions.push({
        type: 'personal',
        societyId,
        'participants.userId': userId
      });

      const society = await Society.findById(societyId).lean();
      const isSocietyAdmin = society?.adminContacts?.some(id => id?.toString() === userId?.toString());
      const isSocietyManager = society?.managerIds?.some(id => id?.toString() === userId?.toString());
      const isSecurity = await mongoose.model('Security').exists({ societyId, userId, status: 'active' });

      // 2. Society-level rooms
      const isAnyOwner = userFlatMemberships.some(m => m.isOwner);
      const isAnyTenant = userFlatMemberships.some(m => m.isTenant);
      const isAnyMember = userFlatMemberships.some(m => m.isMember);
      const isAnyTenantMember = userFlatMemberships.some(m => m.isTenantMember);

      // Role-based group access
      if (isSocietyManager || isSocietyAdmin) {
        conditions.push({ type: 'society_owners_managers', societyId });
        conditions.push({ type: 'society_managers_owners_tenants', societyId });
      }

      if (isAnyOwner) {
        conditions.push({ type: 'society_owners', societyId });
        conditions.push({ type: 'society_owners_managers', societyId });
        conditions.push({ type: 'society_managers_owners_tenants', societyId });
      }

      if (isAnyOwner || isAnyTenant) {
        conditions.push({ type: 'society_owners_tenants', societyId });
      }

      if (isAnyTenant) {
        conditions.push({ type: 'society_managers_owners_tenants', societyId });
      }

      if (isSecurity) conditions.push({ type: 'society_security', societyId });
      
      if (isAnyOwner || isAnyTenant || isAnyMember || isAnyTenantMember || isSocietyAdmin || isSocietyManager || isSecurity) {
        conditions.push({ type: 'society_all', societyId });
      }

      // 3. Building-level rooms
      const managedBuildings = await Building.find({ managerId: userId, societyId }).distinct('_id');
      const userFlats = await Flat.find({ _id: { $in: userFlatMemberships.map(m => m.flatId) } }).select('buildingId').lean();
      const userBuildingIds = [...new Set(userFlats.map(f => f.buildingId?.toString()).filter(Boolean))];

      if (userBuildingIds.length > 0 || isSocietyAdmin || isSocietyManager || isSecurity || managedBuildings.length > 0) {
        if (isSocietyAdmin || isSocietyManager || isSecurity) {
          conditions.push({ type: 'building_all', societyId });
        } else {
          const allowedBIds = [...new Set([...userBuildingIds, ...managedBuildings.map(id=>id?.toString())])];
          conditions.push({ type: 'building_all', societyId, buildingId: { $in: allowedBIds } });
        }
      }

      const userOwnedFlats = userFlatMemberships.filter(m => m.isOwner).map(m => m.flatId);
      const ownedBuildings = await Flat.find({ _id: { $in: userOwnedFlats } }).distinct('buildingId');
      
      if (ownedBuildings.length > 0 || isSocietyAdmin || isSocietyManager || managedBuildings.length > 0) {
        if (isSocietyAdmin || isSocietyManager) {
          conditions.push({ type: 'building_owners_admins', societyId });
        } else {
          const allowedBIds = [...new Set([...ownedBuildings.map(id=>id?.toString()), ...managedBuildings.map(id=>id?.toString())])];
          conditions.push({ type: 'building_owners_admins', societyId, buildingId: { $in: allowedBIds } });
        }
      }

      // 4. Flat-level rooms
      const ownerOrMemberFlats = userFlatMemberships.filter(m => m.isOwner || m.isMember).map(m => m.flatId);
      if (ownerOrMemberFlats.length > 0) conditions.push({ type: 'flat_owner_members', societyId, flatId: { $in: ownerOrMemberFlats } });

      const ownerOrTenantFlats = userFlatMemberships.filter(m => m.isOwner || m.isTenant || m.isTenantMember).map(m => m.flatId);
      if (ownerOrTenantFlats.length > 0) conditions.push({ type: 'flat_owner_tenants', societyId, flatId: { $in: ownerOrTenantFlats } });

      const tenantOrTenantMemberFlats = userFlatMemberships.filter(m => m.isTenant || m.isTenantMember).map(m => m.flatId);
      if (tenantOrTenantMemberFlats.length > 0) conditions.push({ type: 'flat_tenants', societyId, flatId: { $in: tenantOrTenantMemberFlats } });
    } else {
      // All personal rooms across all societies if no societyId filter
      conditions.push({
        type: 'personal',
        'participants.userId': userId
      });
    }

    let query = { $or: conditions, isActive: true };
    if (type) query.type = type;
    if (flatId) query.flatId = flatId; // Keep simple filter if explicitly passed, but won't be used by UI now

    const rooms = await ChatRoom.find(query)
      .populate('societyId', 'name')
      .populate('buildingId', 'buildingName buildingNumber')
      .populate('flatId', 'flatNumber buildingId')
      .populate('lastMessage.sentByUserId', 'name profilePicture')
      .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 })
      .lean();

    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const participant = room.participants?.find(p => p?.userId?.toString() === userId?.toString());
        const lastReadAt = participant?.lastReadAt || new Date(0);

        const unreadCount = await ChatMessage.countDocuments({
          roomId: room._id,
          sentAt: { $gt: lastReadAt },
          senderId: { $ne: userId },
          isDeletedForEveryone: { $ne: true },
          deletedForUsers: { $ne: userId }
        });

        let lastMsg = room.lastMessage;
        if (!lastMsg || (!lastMsg.content && !lastMsg.type && !lastMsg.messageId)) {
          const latestDbMsg = await ChatMessage.findOne({ 
            roomId: room._id,
            isDeletedForEveryone: { $ne: true },
            deletedForUsers: { $ne: userId }
          })
            .sort({ sentAt: -1 })
            .select('content type sentAt senderName senderId')
            .lean();
            
          if (latestDbMsg) {
            lastMsg = {
              messageId: latestDbMsg._id,
              content: latestDbMsg.type === 'text' ? latestDbMsg.content : `[${latestDbMsg.type}]`,
              type: latestDbMsg.type || 'text',
              sentAt: latestDbMsg.sentAt,
              senderName: latestDbMsg.senderName,
              sentByUserId: latestDbMsg.senderId
            };
          }
        }

        return {
          ...room,
          lastMessage: lastMsg,
          unreadCount,
          isBlocked: participant?.isBlocked || false
        };
      })
    );

    return enrichedRooms;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a specific chat room by ID
 */
export const getRoomById = async (roomId, userId) => {
  const room = await ChatRoom.findById(roomId)
    .populate('societyId', 'name')
    .populate('buildingId', 'buildingName buildingNumber')
    .populate('flatId', 'flatNumber buildingId')
    .populate('lastMessage.sentByUserId', 'name profilePicture')
    .lean();

  if (!room) throw new Error('Chat room not found');

  const hasAccess = await userHasRoomAccess(userId, room);
  if (!hasAccess) throw new Error('You do not have access to this chat room');

  const participant = room.participants?.find(p => p.userId?.toString() === userId?.toString());
  const lastReadAt = participant?.lastReadAt || new Date(0);

  const unreadCount = await ChatMessage.countDocuments({
    roomId: room._id,
    sentAt: { $gt: lastReadAt },
    senderId: { $ne: userId },
    isDeletedForEveryone: { $ne: true },
    deletedForUsers: { $ne: userId }
  });

  return {
    ...room,
    unreadCount,
    isBlocked: participant?.isBlocked || false
  };
};

/**
 * Get messages for a chat room (paginated)
 */
export const getRoomMessages = async (roomId, userId, options = {}) => {
  const { page = 1, limit = 50, before } = options;

  const room = await ChatRoom.findById(roomId).lean();
  if (!room) throw new Error('Chat room not found');

  const query = {
    roomId,
    isDeleted: { $ne: true },
    isDeletedForEveryone: { $ne: true },
    deletedForUsers: { $ne: userId }
  };

  if (before) {
    query.sentAt = { $lt: new Date(before) };
  }

  const skip = before ? 0 : (page - 1) * limit;

  const messages = await ChatMessage.find(query)
    .populate('senderId', 'name profilePicture')
    .populate('replyTo.senderId', 'name')
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await ChatMessage.countDocuments(query);

  return {
    data: messages.reverse(), // Return chronological order
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  };
};

/**
 * Send a message to a room
 */
export const sendMessage = async (roomId, userId, messageData) => {
  const room = await ChatRoom.findById(roomId);
  if (!room) throw new Error('Chat room not found');

  // Check feature access
  const featureCheck = await checkFeatureAccess(room.societyId, FEATURES.CHAT);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  // Verify user has access to this room
  const hasAccess = await userHasRoomAccess(userId, room);
  if (!hasAccess) {
    throw new Error('You do not have access to this chat room');
  }

  // Check block status for personal chats
  if (room.type === 'personal') {
    const blockedParticipant = room.participants?.find(
      p => p.userId?.toString() !== userId?.toString() && p.isBlocked
    );
    if (blockedParticipant) {
      throw new Error('You cannot send messages in this conversation');
    }
  }

  // Get sender info
  const sender = await User.findById(userId).select('name profilePicture').lean();
  let senderName = sender?.name || 'Unknown';
  let senderSubtitle = '';

  if (room.type.startsWith('society') || room.type.startsWith('building')) {
    const memberships = await FlatMember.find({ userId, societyId: room.societyId, isDeleted: { $ne: true } }).lean();
    if (memberships && memberships.length > 0) {
      const firstM = memberships[0];
      const flat = await Flat.findById(firstM.flatId).populate('buildingId', 'buildingNumber').lean();
      if (flat) {
        senderSubtitle = senderName; // Original name goes to subtitle
        senderName = `Flat ${flat.flatNumber}`;
        if (flat.buildingId && flat.buildingId.buildingNumber) {
          senderName = `Bldg ${flat.buildingId.buildingNumber}, ` + senderName;
        }
      }
    }
  }

  const message = new ChatMessage({
    roomId,
    societyId: room.societyId,
    senderId: userId,
    senderName,
    senderSubtitle,
    sentAt: new Date(),
    ...messageData
  });

  await message.save();

  // Update room's last message
  room.lastMessage = {
    messageId: message._id,
    content: messageData.type === 'text' ? messageData.content : `[${messageData.type}]`,
    type: messageData.type || 'text',
    sentAt: message.sentAt,
    sentByUserId: userId,
    senderName: senderName
  };
  room.messageCount = (room.messageCount || 0) + 1;
  await room.save();

  const populated = await ChatMessage.findById(message._id)
    .populate('senderId', 'name profilePicture')
    .populate('replyTo.senderId', 'name')
    .lean();

  return populated;
};

/**
 * Mark messages as read for a user in a room
 */
export const markRoomAsRead = async (roomId, userId) => {
  const room = await ChatRoom.findById(roomId);
  if (!room) throw new Error('Chat room not found');

  const now = new Date();

  // Update last read in room participants
  const participantIndex = room.participants?.findIndex(
    p => p.userId?.toString() === userId?.toString()
  );

  if (participantIndex >= 0) {
    room.participants[participantIndex].lastReadAt = now;
  } else {
    if (!room.participants) room.participants = [];
    room.participants.push({ userId, lastReadAt: now });
  }
  await room.save();

  return { success: true, readAt: now };
};

/**
 * Delete a message for everyone (only within 15 minutes)
 */
export const deleteMessageForEveryone = async (messageId, userId) => {
  const message = await ChatMessage.findById(messageId);
  if (!message) throw new Error('Message not found');

  if (message.senderId.toString() !== userId.toString()) {
    throw new Error('You can only delete your own messages');
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  if (message.sentAt < fifteenMinutesAgo) {
    throw new Error('You can only delete messages within 15 minutes of sending');
  }

  message.isDeletedForEveryone = true;
  message.deletedForEveryone = {
    deletedAt: new Date(),
    deletedByUserId: userId
  };
  message.content = 'This message was deleted';
  await message.save();

  return { success: true };
};

/**
 * Delete a message for the current user only
 */
export const deleteMessageForMe = async (messageId, userId) => {
  const message = await ChatMessage.findById(messageId);
  if (!message) throw new Error('Message not found');

  if (!message.deletedForUsers.includes(userId)) {
    message.deletedForUsers.push(userId);
    await message.save();
  }

  return { success: true };
};

/**
 * Clear all messages for a user in a room (for me only)
 */
export const clearChatForMe = async (roomId, userId) => {
  const room = await ChatRoom.findById(roomId);
  if (!room) throw new Error('Chat room not found');

  // Add userId to deletedForUsers for all messages in this room
  await ChatMessage.updateMany(
    { roomId, deletedForUsers: { $ne: userId } },
    { $push: { deletedForUsers: userId } }
  );

  return { success: true };
};

/**
 * Block/Unblock a user in personal chat
 */
export const toggleBlockUser = async (roomId, requestingUserId) => {
  const room = await ChatRoom.findById(roomId);
  if (!room || room.type !== 'personal') throw new Error('Invalid room');

  const participant = room.participants?.find(
    p => p?.userId?.toString() === requestingUserId?.toString()
  );

  if (!participant) throw new Error('You are not a participant in this chat');

  participant.isBlocked = !participant.isBlocked;
  participant.blockedAt = participant.isBlocked ? new Date() : null;
  await room.save();

  return { isBlocked: participant.isBlocked };
};

/**
 * Get or create a personal chat room between two users
 */
export const getOrCreatePersonalRoom = async (userId, targetUserId, societyId) => {
  // Check if room already exists
  const existing = await ChatRoom.findOne({
    type: 'personal',
    societyId,
    'participants.userId': { $all: [userId, targetUserId] }
  });

  if (existing) return existing;

  // Check feature access
  const featureCheck = await checkFeatureAccess(societyId, FEATURES.CHAT);
  if (!featureCheck.allowed) throw new Error(featureCheck.reason);

  // Get user info
  const [user, target] = await Promise.all([
    User.findById(userId).select('name').lean(),
    User.findById(targetUserId).select('name').lean()
  ]);

  const room = new ChatRoom({
    type: 'personal',
    societyId,
    name: `${user?.name} & ${target?.name}`,
    participants: [
      { userId, joinedAt: new Date() },
      { userId: targetUserId, joinedAt: new Date() }
    ]
  });

  await room.save();
  return room;
};

/**
 * Ensure all auto-generated chat rooms exist for a society
 * Called when society, building, or flat is created/updated
 */
export const ensureSocietyChatRooms = async (societyId) => {
  const society = await Society.findById(societyId).select('societyName').lean();
  if (!society) return;

  const types = [
    { type: 'society_owners_tenants', name: `${society.societyName} - Owners & Tenants` },
    { type: 'society_owners', name: `${society.societyName} - Owners Only` },
    { type: 'society_owners_managers', name: `${society.societyName} - Owners and Managers` },
    { type: 'society_managers_owners_tenants', name: `${society.societyName} - Managers, Owners & Tenants` },
    { type: 'society_security', name: `${society.societyName} - Security` },
    { type: 'society_all', name: `${society.societyName} - All Members` }
  ];

  for (const t of types) {
    await ChatRoom.findOneAndUpdate(
      { type: t.type, societyId },
      { $set: { type: t.type, societyId, name: t.name, isActive: true } },
      { upsert: true, new: true }
    );
  }
};

/**
 * Ensure building chat room exists
 */
export const ensureBuildingChatRoom = async (societyId, buildingId) => {
  const building = await Building.findById(buildingId).select('buildingName buildingNumber managerId').lean();
  if (!building) return;

  const name = building.buildingName || `Building ${building.buildingNumber}`;

  await ChatRoom.findOneAndUpdate(
    { type: 'building_all', societyId, buildingId },
    { $set: { type: 'building_all', societyId, buildingId, name: `${name} - All Members`, isActive: true } },
    { upsert: true, new: true }
  );

  if (building.managerId) {
    await ChatRoom.findOneAndUpdate(
      { type: 'building_owners_admins', societyId, buildingId },
      { $set: { type: 'building_owners_admins', societyId, buildingId, name: `${name} - Owners & Building Admins`, isActive: true } },
      { upsert: true, new: true }
    );
  }
};

/**
 * Ensure flat chat rooms exist
 */
export const ensureFlatChatRooms = async (societyId, flatId) => {
  const flat = await Flat.findById(flatId).select('flatNumber buildingId').lean();
  if (!flat) return;

  const flatLabel = `Flat ${flat.flatNumber}`;

  const types = [
    { type: 'flat_owner_members', name: `${flatLabel} - Owner & Members` },
    { type: 'flat_owner_tenants', name: `${flatLabel} - Owner & Tenants` },
    { type: 'flat_tenants', name: `${flatLabel} - Tenants & Tenant Members` }
  ];

  for (const t of types) {
    await ChatRoom.findOneAndUpdate(
      { type: t.type, societyId, flatId },
      { $set: { type: t.type, societyId, buildingId: flat.buildingId, flatId, name: t.name, isActive: true } },
      { upsert: true, new: true }
    );
  }
};

/**
 * Search across accessible chat rooms and messages
 */
export const searchChats = async (userId, societyId, searchTerm, options = {}) => {
  const { page = 1, limit = 20 } = options;

  if (!searchTerm || searchTerm.trim().length < 2) {
    return { rooms: [], messages: [], total: 0 };
  }

  const regex = new RegExp(searchTerm.trim(), 'i');

  // Get accessible rooms
  const accessibleRooms = await getUserChatRooms(userId, { societyId });
  const roomIds = accessibleRooms.map(r => r._id);

  // Search room names
  const matchingRooms = accessibleRooms.filter(r => regex.test(r.name || ''));

  // Search messages
  const skip = (page - 1) * limit;
  const messages = await ChatMessage.find({
    roomId: { $in: roomIds },
    $or: [
      { content: { $regex: regex } },
      { senderName: { $regex: regex } }
    ],
    isDeletedForEveryone: { $ne: true },
    deletedForUsers: { $ne: userId }
  })
    .populate('senderId', 'name profilePicture')
    .populate('roomId', 'name type')
    .sort({ sentAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  return {
    rooms: matchingRooms,
    messages,
    totalRooms: matchingRooms.length,
    totalMessages: await ChatMessage.countDocuments({
      roomId: { $in: roomIds },
      content: { $regex: regex },
      isDeletedForEveryone: { $ne: true },
      deletedForUsers: { $ne: userId }
    })
  };
};

/**
 * Helper: Check if a user has access to a room
 */
const userHasRoomAccess = async (userId, room) => {
  try {
    if (room.type === 'personal') {
      return room.participants?.some(p => p.userId?.toString() === userId?.toString());
    }

    const societyId = room.societyId?._id || room.societyId;
    const society = await Society.findById(societyId).lean();
    const isSocietyAdmin = society?.adminContacts?.some(id => id?.toString() === userId?.toString());
    const isSocietyManager = society?.managerIds?.some(id => id?.toString() === userId?.toString());
    const isSecurity = await mongoose.model('Security').exists({ societyId, userId, status: 'active' });

    const userFlatMemberships = await FlatMember.find({ userId, societyId, isDeleted: { $ne: true } }).lean();

    if (room.type === 'society_owners_tenants') return userFlatMemberships.some(m => m.isOwner || m.isTenant);
    if (room.type === 'society_owners') return userFlatMemberships.some(m => m.isOwner);
    if (room.type === 'society_owners_managers') return userFlatMemberships.some(m => m.isOwner) || isSocietyAdmin || isSocietyManager;
    if (room.type === 'society_managers_owners_tenants') return userFlatMemberships.some(m => m.isOwner || m.isTenant) || isSocietyAdmin || isSocietyManager;
    if (room.type === 'society_security') return isSecurity;
    if (room.type === 'society_all') return userFlatMemberships.length > 0 || isSocietyAdmin || isSocietyManager || isSecurity;

    if (room.type === 'building_all' || room.type === 'building_owners_admins') {
      const buildingId = room.buildingId?._id || room.buildingId;
      if (isSocietyAdmin || isSocietyManager) return true;
      const isBuildingManager = await Building.exists({ _id: buildingId, managerId: userId });
      if (isBuildingManager) return true;

      if (room.type === 'building_all') {
        if (isSecurity) return true;
        const flatIds = userFlatMemberships.map(m => m.flatId);
        return await Flat.exists({ _id: { $in: flatIds }, buildingId: buildingId });
      } else {
        const ownedFlats = userFlatMemberships.filter(m => m.isOwner).map(m => m.flatId);
        return await Flat.exists({ _id: { $in: ownedFlats }, buildingId: buildingId });
      }
    }

    if (room.type.startsWith('flat_')) {
      const roomFlatId = room.flatId?._id || room.flatId;
      const membership = userFlatMemberships.find(m => m.flatId?.toString() === roomFlatId?.toString());
      if (!membership) return false;

      if (room.type === 'flat_owner_members') return membership.isOwner || membership.isMember;
      if (room.type === 'flat_owner_tenants') return membership.isOwner || membership.isTenant || membership.isTenantMember;
      if (room.type === 'flat_tenants') return membership.isTenant || membership.isTenantMember;
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * @TODO: To be deleted in future.
 * Development/Starting Phase only: Auto-create all missing chat rooms
 */
export const ensureAllPendingChats = async () => {
  const societies = await Society.find().select('_id').lean();
  for (const society of societies) {
    await ensureSocietyChatRooms(society._id);
    
    const buildings = await Building.find({ societyId: society._id }).select('_id').lean();
    for (const building of buildings) {
      await ensureBuildingChatRoom(society._id, building._id);
    }
    
    const flats = await Flat.find({ societyId: society._id }).select('_id').lean();
    for (const flat of flats) {
      await ensureFlatChatRooms(society._id, flat._id);
    }
  }
};
