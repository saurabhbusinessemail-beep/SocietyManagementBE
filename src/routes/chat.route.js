import express from 'express';
const router = express.Router();

import * as chatController from '../controllers/chat.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { checkFeature } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

// All chat routes require authentication
router.use(userAuth);

// ─── Chat Rooms ──────────────────────────────────────────────────────────────

/**
 * GET /chat/rooms
 * Get all chat rooms accessible to the logged-in user.
 * Query params: societyId (optional), flatId (optional), type (optional)
 */
router.get('/rooms', chatController.getChatRooms);

/**
 * GET /chat/rooms/:roomId
 * Get details for a single chat room.
 */
router.get('/rooms/:roomId', chatController.getRoomById);

/**
 * GET /chat/rooms/:roomId/messages
 * Get paginated messages for a room.
 * Query params: page, limit, before (ISO date for cursor pagination)
 */
router.get('/rooms/:roomId/messages', chatController.getRoomMessages);

/**
 * POST /chat/rooms/:roomId/messages
 * Send a message to a room.
 * Body: { type, content, media, location, replyTo }
 */
router.post('/rooms/:roomId/messages', chatController.sendMessage);

/**
 * PATCH /chat/rooms/:roomId/read
 * Mark all messages in a room as read for the logged-in user.
 */
router.patch('/rooms/:roomId/read', chatController.markRoomAsRead);

/**
 * DELETE /chat/rooms/:roomId/clear
 * Clear all messages in a room for the current user (delete for me).
 */
router.delete('/rooms/:roomId/clear', chatController.clearChatForMe);

/**
 * POST /chat/rooms/:roomId/block
 * Toggle block/unblock a user in a personal chat.
 */
router.post('/rooms/:roomId/block', chatController.toggleBlockUser);

// ─── Personal Chat ────────────────────────────────────────────────────────────

/**
 * POST /chat/personal/:targetUserId
 * Get or create a personal chat room with another user.
 * Body: { societyId }
 */
router.post('/personal/:targetUserId', chatController.getOrCreatePersonalChat);

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * DELETE /chat/messages/:messageId/everyone
 * Delete a message for everyone (only within 15 minutes of sending).
 */
router.delete('/messages/:messageId/everyone', chatController.deleteMessageForEveryone);

/**
 * DELETE /chat/messages/:messageId/me
 * Delete a message for the current user only.
 */
router.delete('/messages/:messageId/me', chatController.deleteMessageForMe);

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * GET /chat/search
 * Search rooms and messages.
 * Query params: societyId, q (search term), page, limit
 */
router.get('/search', chatController.searchChats);

// ─── Internal / Setup ─────────────────────────────────────────────────────────

/**
 * POST /chat/setup/society/:societyId
 * Ensure society-level chat rooms exist (called when society is created/updated).
 */
router.post('/setup/society/:societyId', chatController.ensureSocietyChats);

/**
 * POST /chat/setup/society/:societyId/building/:buildingId
 * Ensure building-level chat room exists.
 */
router.post('/setup/society/:societyId/building/:buildingId', chatController.ensureBuildingChats);

/**
 * POST /chat/setup/society/:societyId/flat/:flatId
 * Ensure flat-level chat rooms exist.
 */
router.post('/setup/society/:societyId/flat/:flatId', chatController.ensureFlatChats);

/**
 * POST /chat/setup/all
 * @TODO: To be deleted in future.
 * Development/Starting Phase only: Ensure all chat rooms exist globally
 */
router.post('/setup/all', chatController.ensureAllPendingChats);

export default router;
