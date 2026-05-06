import { ChatRoom, ChatMessage, Flat, FlatMember, Building, Society, User, Security } from '../models';
import { checkFeatureAccess } from './planCache.service';
import { FEATURES } from '../config/features';

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

    const conditions = [];

    if (societyId) {
      // --- Run all independent lookups in parallel ---
      const [userFlatMemberships, society, isSecurity, managedBuildings] = await Promise.all([
        FlatMember.find(membershipQuery).lean(),
        Society.findById(societyId).select('adminContacts managerIds').lean(),
        Security.exists({ societyId, userId, status: 'active' }),
        Building.find({ managerId: userId, societyId }).distinct('_id')
      ]);

      const isSocietyAdmin = society?.adminContacts?.some(id => id?.toString() === userId?.toString());
      const isSocietyManager = society?.managerIds?.some(id => id?.toString() === userId?.toString());

      // 1. Personal rooms within this society
      conditions.push({ type: 'personal', societyId, 'participants.userId': userId });

      // 2. Society-level rooms
      const isAnyOwner = userFlatMemberships.some(m => m.isOwner);
      const isAnyTenant = userFlatMemberships.some(m => m.isTenant);
      const isAnyMember = userFlatMemberships.some(m => m.isMember);
      const isAnyTenantMember = userFlatMemberships.some(m => m.isTenantMember);

      if (isSocietyManager || isSocietyAdmin) {
        conditions.push({ type: 'society_owners_managers', societyId });
        conditions.push({ type: 'society_managers_owners_tenants', societyId });
      }
      if (isAnyOwner) {
        conditions.push({ type: 'society_owners', societyId });
        conditions.push({ type: 'society_owners_managers', societyId });
        conditions.push({ type: 'society_managers_owners_tenants', societyId });
      }
      if (isAnyOwner || isAnyTenant) conditions.push({ type: 'society_owners_tenants', societyId });
      if (isAnyTenant) conditions.push({ type: 'society_managers_owners_tenants', societyId });
      if (isSecurity) conditions.push({ type: 'society_security', societyId });
      if (isAnyOwner || isAnyTenant || isAnyMember || isAnyTenantMember || isSocietyAdmin || isSocietyManager || isSecurity) {
        conditions.push({ type: 'society_all', societyId });
      }

      // 3. Building-level rooms
      // Single Flat.find covers both userFlats (for building_all) and ownedFlats (for building_owners_admins)
      const memberFlatIds = userFlatMemberships.map(m => m.flatId);
      const userFlats = memberFlatIds.length > 0
        ? await Flat.find({ _id: { $in: memberFlatIds } }).select('_id buildingId').lean()
        : [];

      const flatBuildingMap = {};
      userFlats.forEach(f => { flatBuildingMap[f._id.toString()] = f.buildingId?.toString(); });

      const userBuildingIds = [...new Set(userFlats.map(f => f.buildingId?.toString()).filter(Boolean))];
      const ownedFlatIds = userFlatMemberships.filter(m => m.isOwner).map(m => m.flatId?.toString());
      const ownedBuildings = [...new Set(ownedFlatIds.map(id => flatBuildingMap[id]).filter(Boolean))];

      if (userBuildingIds.length > 0 || isSocietyAdmin || isSocietyManager || isSecurity || managedBuildings.length > 0) {
        if (isSocietyAdmin || isSocietyManager || isSecurity) {
          conditions.push({ type: 'building_all', societyId });
        } else {
          const allowedBIds = [...new Set([...userBuildingIds, ...managedBuildings.map(id => id?.toString())])];
          conditions.push({ type: 'building_all', societyId, buildingId: { $in: allowedBIds } });
        }
      }

      if (ownedBuildings.length > 0 || isSocietyAdmin || isSocietyManager || managedBuildings.length > 0) {
        if (isSocietyAdmin || isSocietyManager) {
          conditions.push({ type: 'building_owners_admins', societyId });
        } else {
          const allowedBIds = [...new Set([...ownedBuildings, ...managedBuildings.map(id => id?.toString())])];
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
      // No societyId filter — only personal rooms
      conditions.push({ type: 'personal', 'participants.userId': userId });
    }

    let query = { $or: conditions, isActive: true };
    if (type) query.type = type;
    if (flatId) query.flatId = flatId;

    const rooms = await ChatRoom.find(query)
      .populate('societyId', 'name')
      .populate('buildingId', 'buildingName buildingNumber')
      .populate('flatId', 'flatNumber buildingId')
      .populate('lastMessage.sentByUserId', 'name profilePicture')
      .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 })
      .lean();

    if (rooms.length === 0) return [];

    const roomIds = rooms.map(r => r._id);

    // Build per-room lastReadAt map from participants
    const lastReadMap = {};
    rooms.forEach(room => {
      const p = room.participants?.find(p => p?.userId?.toString() === userId?.toString());
      lastReadMap[room._id.toString()] = p?.lastReadAt || new Date(0);
    });

    // --- Bulk aggregate unread counts (1 DB call instead of N) ---
    const unreadAgg = await ChatMessage.aggregate([
      {
        $match: {
          roomId: { $in: roomIds },
          senderId: { $ne: userId },
          isDeletedForEveryone: { $ne: true },
          deletedForUsers: { $ne: userId }
        }
      },
      {
        $group: {
          _id: '$roomId',
          messages: { $push: { sentAt: '$sentAt' } }
        }
      }
    ]);

    const unreadMap = {};
    unreadAgg.forEach(row => {
      const lastReadAt = lastReadMap[row._id.toString()] || new Date(0);
      unreadMap[row._id.toString()] = row.messages.filter(m => m.sentAt > lastReadAt).length;
    });

    // --- Bulk fetch latest message for rooms missing lastMessage (1 DB call instead of N) ---
    const roomsMissingLastMsg = rooms
      .filter(r => !r.lastMessage?.messageId && !r.lastMessage?.content)
      .map(r => r._id);

    const latestMsgMap = {};
    if (roomsMissingLastMsg.length > 0) {
      const latestMsgs = await ChatMessage.aggregate([
        {
          $match: {
            roomId: { $in: roomsMissingLastMsg },
            isDeletedForEveryone: { $ne: true },
            deletedForUsers: { $ne: userId }
          }
        },
        { $sort: { sentAt: -1 } },
        {
          $group: {
            _id: '$roomId',
            content: { $first: '$content' },
            type: { $first: '$type' },
            sentAt: { $first: '$sentAt' },
            senderName: { $first: '$senderName' },
            senderId: { $first: '$senderId' },
            msgId: { $first: '$_id' }
          }
        }
      ]);
      latestMsgs.forEach(m => { latestMsgMap[m._id.toString()] = m; });
    }

    // Assemble enriched rooms — zero additional DB calls
    const enrichedRooms = rooms.map(room => {
      const rid = room._id.toString();
      const participant = room.participants?.find(p => p?.userId?.toString() === userId?.toString());
      const unreadCount = unreadMap[rid] || 0;

      let lastMsg = room.lastMessage;
      if (!lastMsg?.messageId && !lastMsg?.content) {
        const m = latestMsgMap[rid];
        if (m) {
          lastMsg = {
            messageId: m.msgId,
            content: m.type === 'text' ? m.content : `[${m.type}]`,
            type: m.type || 'text',
            sentAt: m.sentAt,
            senderName: m.senderName,
            sentByUserId: m.senderId
          };
        }
      }

      return {
        ...room,
        lastMessage: lastMsg,
        unreadCount,
        isBlocked: participant?.isBlocked || false
      };
    });

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

  const [messages, total] = await Promise.all([
    ChatMessage.find(query)
      .populate('senderId', 'name profilePicture')
      .populate('replyTo.senderId', 'name')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    ChatMessage.countDocuments(query)
  ]);

  return {
    data: messages.reverse(),
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

  // Get sender info + flat membership in parallel
  const isGroupRoom = room.type.startsWith('society') || room.type.startsWith('building');
  const [sender, memberships] = await Promise.all([
    User.findById(userId).select('name profilePicture').lean(),
    isGroupRoom
      ? FlatMember.find({ userId, societyId: room.societyId, isDeleted: { $ne: true } }).lean()
      : Promise.resolve([])
  ]);

  let senderName = sender?.name || 'Unknown';
  let senderSubtitle = '';

  if (memberships.length > 0) {
    // Parallelize flat lookup alongside any other potential work
    const flat = await Flat.findById(memberships[0].flatId).populate('buildingId', 'buildingNumber').lean();
    if (flat) {
      senderSubtitle = senderName;
      senderName = `Flat ${flat.flatNumber}`;
      if (flat.buildingId?.buildingNumber) {
        senderName = `Bldg ${flat.buildingId.buildingNumber}, ` + senderName;
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

  // 🔔 Send Real-time Notification via FCM
  try {
    const participantIds = await getRoomParticipantIds(room);
    // Remove the sender from notification list
    const targetUserIds = participantIds.filter(id => id.toString() !== userId.toString());

    if (targetUserIds.length > 0) {
      const { sendChatMessageNotification } = require('./notification.service');
      await sendChatMessageNotification(targetUserIds, {
        roomId: roomId.toString(),
        roomType: room.type,
        messageId: message._id.toString(),
        senderName: senderName,
        senderId: userId.toString(),
        content: messageData.type === 'text' ? messageData.content : `[${messageData.type}]`,
        type: messageData.type || 'text',
        sentAt: message.sentAt.toISOString(),
        societyId: room.societyId.toString()
      });
    }
  } catch (notificationError) {
    console.error('Error sending chat notifications:', notificationError);
    // We don't throw here to avoid failing the message send if notification fails
  }

  return populated;
};

/**
 * Helper: Get all user IDs that have access to a room
 */
export const getRoomParticipantIds = async (room) => {
  if (room.type === 'personal') {
    return room.participants.map(p => p.userId);
  }

  const societyId = room.societyId?._id || room.societyId;

  // --- society_all: fetch all three sources in parallel ---
  if (room.type === 'society_all') {
    const [members, society, security] = await Promise.all([
      FlatMember.find({ societyId, isDeleted: { $ne: true } }).distinct('userId'),
      Society.findById(societyId).select('adminContacts managerIds').lean(),
      Security.find({ societyId, status: 'active' }).distinct('userId')
    ]);
    return [...new Set([...members, ...(society?.adminContacts || []), ...(society?.managerIds || []), ...security])];
  }

  if (room.type.startsWith('society_')) {
    // Determine which parallel queries are needed
    const needsManagers = room.type.includes('managers');
    const needsOwners = room.type.includes('owners');
    const needsTenants = room.type.includes('tenants');
    const needsSecurity = room.type === 'society_security';

    const [society, owners, tenants, security] = await Promise.all([
      needsManagers ? Society.findById(societyId).select('adminContacts managerIds').lean() : Promise.resolve(null),
      needsOwners ? FlatMember.find({ societyId, isOwner: true, isDeleted: { $ne: true } }).distinct('userId') : Promise.resolve([]),
      needsTenants ? FlatMember.find({ societyId, isTenant: true, isDeleted: { $ne: true } }).distinct('userId') : Promise.resolve([]),
      needsSecurity ? Security.find({ societyId, status: 'active' }).distinct('userId') : Promise.resolve([])
    ]);

    const userIds = [
      ...(society?.adminContacts || []),
      ...(society?.managerIds || []),
      ...owners,
      ...tenants,
      ...security
    ];
    return [...new Set(userIds)];
  }

  if (room.type.startsWith('building_')) {
    const buildingId = room.buildingId?._id || room.buildingId;

    // Fetch building info, society info, and flat IDs for this building in parallel
    const [building, society, buildingFlatIds] = await Promise.all([
      Building.findById(buildingId).select('managerId').lean(),
      Society.findById(societyId).select('adminContacts managerIds').lean(),
      Flat.find({ buildingId }).distinct('_id')
    ]);

    let userIds = [...(society?.adminContacts || []), ...(society?.managerIds || [])];
    if (building?.managerId) userIds.push(building.managerId);

    if (room.type === 'building_all') {
      // Fetch residents and security in parallel (flat IDs already known)
      const [residents, security] = await Promise.all([
        FlatMember.find({ societyId, flatId: { $in: buildingFlatIds }, isDeleted: { $ne: true } }).distinct('userId'),
        Security.find({ societyId, status: 'active' }).distinct('userId')
      ]);
      userIds.push(...residents, ...security);
    } else if (room.type === 'building_owners_admins') {
      const owners = await FlatMember.find({
        societyId,
        isOwner: true,
        flatId: { $in: buildingFlatIds },
        isDeleted: { $ne: true }
      }).distinct('userId');
      userIds.push(...owners);
    }
    return [...new Set(userIds)];
  }

  if (room.type.startsWith('flat_')) {
    const flatId = room.flatId?._id || room.flatId;
    const memberships = await FlatMember.find({ flatId, isDeleted: { $ne: true } }).lean();

    let userIds = [];
    if (room.type === 'flat_owner_members') {
      userIds = memberships.filter(m => m.isOwner || m.isMember).map(m => m.userId);
    } else if (room.type === 'flat_owner_tenants') {
      userIds = memberships.filter(m => m.isOwner || m.isTenant || m.isTenantMember).map(m => m.userId);
    } else if (room.type === 'flat_tenants') {
      userIds = memberships.filter(m => m.isTenant || m.isTenantMember).map(m => m.userId);
    }
    return [...new Set(userIds)];
  }

  return [];
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

  // Run all upserts in parallel instead of sequentially
  await Promise.all(types.map(t =>
    ChatRoom.findOneAndUpdate(
      { type: t.type, societyId },
      { $set: { type: t.type, societyId, name: t.name, isActive: true } },
      { upsert: true, new: true }
    )
  ));
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

  // Run all upserts in parallel instead of sequentially
  await Promise.all(types.map(t =>
    ChatRoom.findOneAndUpdate(
      { type: t.type, societyId, flatId },
      { $set: { type: t.type, societyId, buildingId: flat.buildingId, flatId, name: t.name, isActive: true } },
      { upsert: true, new: true }
    )
  ));
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

    // Fetch society info, security status, and flat memberships in parallel
    const [society, isSecurity, userFlatMemberships] = await Promise.all([
      Society.findById(societyId).select('adminContacts managerIds').lean(),
      Security.exists({ societyId, userId, status: 'active' }),
      FlatMember.find({ userId, societyId, isDeleted: { $ne: true } }).lean()
    ]);
    const isSocietyAdmin = society?.adminContacts?.some(id => id?.toString() === userId?.toString());
    const isSocietyManager = society?.managerIds?.some(id => id?.toString() === userId?.toString());

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

  // Process all societies in parallel
  await Promise.all(societies.map(async (society) => {
    const sid = society._id;

    // Fetch buildings and flats in parallel, alongside society room creation
    const [buildings, flats] = await Promise.all([
      Building.find({ societyId: sid }).select('_id').lean(),
      Flat.find({ societyId: sid }).select('_id').lean(),
      ensureSocietyChatRooms(sid)
    ]);

    // Process building and flat rooms in parallel
    await Promise.all([
      ...buildings.map(b => ensureBuildingChatRoom(sid, b._id)),
      ...flats.map(f => ensureFlatChatRooms(sid, f._id))
    ]);
  }));
};
