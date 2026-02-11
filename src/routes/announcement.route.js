const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { isSocietyAdmin, isSocietyMember } = require('../middlewares/societyAnnouncement.middleware');
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';

router.use(userAuth);

// Public routes (for society members)
router.get('/society/:societyId', isSocietyMember, announcementController.getSocietyAnnouncements);

router.get('/society/:societyId/pinned', isSocietyMember, announcementController.getPinnedAnnouncements);

router.get('/society/:societyId/upcoming', isSocietyMember, announcementController.getUpcomingAnnouncements);

router.get('/society/:societyId/category/:category', isSocietyMember, announcementController.getAnnouncementsByCategory);

router.get('/society/:societyId/priority/:priority', isSocietyMember, announcementController.getAnnouncementsByPriority);

router.get('/society/:societyId/search', isSocietyMember, announcementController.searchAnnouncements);

router.get('/society/:societyId/export', isSocietyMember, announcementController.exportAnnouncements);

router.get('/:id', isSocietyMember, announcementController.getAnnouncement);

router.post('/:id/view', isSocietyMember, announcementController.trackView);

// router.get('/user/:userId', isSocietyMember, announcementController.getUserAnnouncements);

// Admin/Manager routes
router.post('/', isSocietyAdmin, newRecordFields, announcementController.createAnnouncement);

router.put('/:id', isSocietyAdmin, announcementController.updateAnnouncement);

router.delete('/:id', isSocietyAdmin, announcementController.deleteAnnouncement);

router.patch('/:id/pin', isSocietyAdmin, announcementController.togglePinAnnouncement);

router.post('/bulk-update', isSocietyAdmin, announcementController.bulkUpdateAnnouncements);

router.get('/stats/:societyId', isSocietyAdmin, announcementController.getAnnouncementStats);

// Publishing routes
router.patch('/:id/publish', isSocietyAdmin, announcementController.publishAnnouncement);

router.patch('/:id/unpublish', isSocietyAdmin, announcementController.unpublishAnnouncement);

export default router;
