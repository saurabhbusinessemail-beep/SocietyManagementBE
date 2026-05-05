const chatService = require('../services/chat.service');

/**
 * Get all chat rooms for the logged-in user
 */
export const getChatRooms = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const { societyId, flatId, type } = req.query;

    const rooms = await chatService.getUserChatRooms(userId, { societyId, flatId, type });

    res.json({
      success: true,
      data: rooms,
      total: rooms.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific chat room for the logged-in user
 */
export const getRoomById = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const { roomId } = req.params;

    const room = await chatService.getRoomById(roomId, userId);

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages for a specific chat room
 */
export const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = res.locals.user._id;
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      before: req.query.before
    };

    const result = await chatService.getRoomMessages(roomId, userId, options);

    // Mark room as read when messages are fetched
    await chatService.markRoomAsRead(roomId, userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message to a chat room
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = res.locals.user._id;
    const messageData = req.body;

    const message = await chatService.sendMessage(roomId, userId, messageData);

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  } catch (error) {
    if (error.message?.includes('access')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message?.includes('blocked')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Mark all messages in a room as read
 */
export const markRoomAsRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = res.locals.user._id;

    const result = await chatService.markRoomAsRead(roomId, userId);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a message for everyone (within 15 minutes)
 */
export const deleteMessageForEveryone = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = res.locals.user._id;

    const result = await chatService.deleteMessageForEveryone(messageId, userId);

    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message?.includes('within 15 minutes')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message?.includes('own messages')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Delete a message for me only
 */
export const deleteMessageForMe = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = res.locals.user._id;

    const result = await chatService.deleteMessageForMe(messageId, userId);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all messages in a room for the current user
 */
export const clearChatForMe = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = res.locals.user._id;

    const result = await chatService.clearChatForMe(roomId, userId);

    res.json({ success: true, ...result, message: 'Chat cleared successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle block/unblock a user in personal chat
 */
export const toggleBlockUser = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = res.locals.user._id;

    const result = await chatService.toggleBlockUser(roomId, userId);

    res.json({
      success: true,
      ...result,
      message: result.isBlocked ? 'User blocked successfully' : 'User unblocked successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start or get a personal chat with another user
 */
export const getOrCreatePersonalChat = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { societyId } = req.body;
    const userId = res.locals.user._id;

    if (!societyId) {
      return res.status(400).json({ success: false, message: 'societyId is required' });
    }

    const room = await chatService.getOrCreatePersonalRoom(userId, targetUserId, societyId);

    res.json({
      success: true,
      data: room,
      message: 'Personal chat ready'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ensure chat rooms exist for a society
 */
export const ensureSocietyChats = async (req, res, next) => {
  try {
    const { societyId } = req.params;

    await chatService.ensureSocietyChatRooms(societyId);

    res.json({ success: true, message: 'Society chat rooms ensured' });
  } catch (error) {
    next(error);
  }
};

/**
 * Ensure chat rooms for a building
 */
export const ensureBuildingChats = async (req, res, next) => {
  try {
    const { societyId, buildingId } = req.params;

    await chatService.ensureBuildingChatRoom(societyId, buildingId);

    res.json({ success: true, message: 'Building chat room ensured' });
  } catch (error) {
    next(error);
  }
};

/**
 * Ensure chat rooms for a flat
 */
export const ensureFlatChats = async (req, res, next) => {
  try {
    const { societyId, flatId } = req.params;

    await chatService.ensureFlatChatRooms(societyId, flatId);

    res.json({ success: true, message: 'Flat chat rooms ensured' });
  } catch (error) {
    next(error);
  }
};

/**
 * Search chat rooms and messages
 */
export const searchChats = async (req, res, next) => {
  try {
    const userId = res.locals.user._id;
    const { societyId, q: searchTerm } = req.query;
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20
    };

    if (!searchTerm) {
      return res.status(400).json({ success: false, message: 'Search term is required' });
    }

    const result = await chatService.searchChats(userId, societyId, searchTerm, options);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/**
 * @TODO: To be deleted in future.
 * Development/Starting Phase only: Ensure all chat rooms exist globally
 */
export const ensureAllPendingChats = async (req, res, next) => {
  try {
    // Run asynchronously without blocking response if it takes long
    chatService.ensureAllPendingChats().catch(console.error);

    res.json({ success: true, message: 'Background job started to ensure all chat rooms.' });
  } catch (error) {
    next(error);
  }
};
