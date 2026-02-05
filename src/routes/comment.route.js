const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comments.controller');
const { isSocietyMember } = require('../middleware/auth');
import { userAuth } from '../middlewares/auth.middleware';

router.use(userAuth);


// All routes require authentication
router.use(auth.verifyToken);

// Public routes (for society members)
router.get('/announcement/:announcementId', isSocietyMember, commentController.getComments);
router.get('/announcement/:announcementId/tree', isSocietyMember, commentController.getCommentTree);

// Comment actions
router.post('/', isSocietyMember, commentController.createComment);
router.put('/:id', isSocietyMember, commentController.updateComment);
router.delete('/:id', isSocietyMember, commentController.deleteComment);
router.post('/:id/like', isSocietyMember, commentController.toggleLike);
router.post('/:id/report', isSocietyMember, commentController.reportComment);

// Admin routes (add your admin middleware)
router.patch('/:id/pin', /* isSocietyAdmin */ commentController.togglePinComment);
router.patch('/:id/hide', /* isSocietyAdmin */ commentController.toggleHideComment);
router.get('/stats/:announcementId', /* isSocietyAdmin */ commentController.getCommentStats);

module.exports = router;