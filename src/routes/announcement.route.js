// routes/announcement.routes.js
const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const { isSocietyAdmin, isSocietyMember } = require('../middlewares/societyAnnouncement.middleware');
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { updateRecordFields } from '../middlewares/updateRecordFields';
import { checkFeature, checkFeatureCombo } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

router.use(userAuth);

// Public routes (for society members)
router.get('/society/:societyId',
    isSocietyMember,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.getSocietyAnnouncements
);

router.get('/society/:societyId/pinned',
    isSocietyMember,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.getPinnedAnnouncements
);

router.get('/society/:societyId/upcoming',
    isSocietyMember,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.getUpcomingAnnouncements
);

router.get('/society/:societyId/category/:category',
    isSocietyMember,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.getAnnouncementsByCategory
);

router.get('/society/:societyId/priority/:priority',
    isSocietyMember,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.getAnnouncementsByPriority
);

router.get('/society/:societyId/search',
    isSocietyMember,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.searchAnnouncements
);

router.get('/society/:societyId/export',
    isSocietyMember,
    checkFeatureCombo(FEATURES.ANNOUNCEMENTS),
    announcementController.exportAnnouncements
);

router.get('/:id',
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.getAnnouncement
);

router.post('/:id/view',
    isSocietyMember,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.trackView
);

// Admin/Manager routes
router.post('/',
    isSocietyAdmin,
    newRecordFields,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.createAnnouncement
);

router.put('/:id',
    updateRecordFields,
    isSocietyAdmin,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.updateAnnouncement
);

router.delete('/:id',
    isSocietyAdmin,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.deleteAnnouncement
);

router.patch('/:id/pin',
    isSocietyAdmin,
    checkFeatureCombo(FEATURES.ANNOUNCEMENTS),
    announcementController.togglePinAnnouncement
);

router.post('/bulk-update',
    isSocietyAdmin,
    checkFeatureCombo(FEATURES.ANNOUNCEMENTS),
    announcementController.bulkUpdateAnnouncements
);

router.get('/stats/:societyId',
    isSocietyAdmin,
    checkFeatureCombo(FEATURES.ANNOUNCEMENTS),
    announcementController.getAnnouncementStats
);

// Publishing routes
router.patch('/:id/publish',
    isSocietyAdmin,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.publishAnnouncement
);

router.patch('/:id/unpublish',
    isSocietyAdmin,
    checkFeature(FEATURES.ANNOUNCEMENTS),
    announcementController.unpublishAnnouncement
);

export default router;