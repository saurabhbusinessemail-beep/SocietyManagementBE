import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import * as complaintController from '../controllers/complaint.controller';
import { newRecordFields } from '../middlewares/newRecordFields';
import { checkFeature } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

const router = express.Router();
router.use(userAuth);

// Get complaints (with societyId in body)
router.post('/',
    checkFeature(FEATURES.COMPLAINTS),
    complaintController.getComplaints
);

// Create complaint
router.post('/add',
    newRecordFields,
    checkFeature(FEATURES.COMPLAINTS),
    complaintController.createComplaint
);

// Change complaint status
router.post('/:complaintId/changeStatus',
    checkFeature(FEATURES.COMPLAINTS),
    complaintController.changeStatus
);

// Delete complaint
router.delete('/:complaintId',
    checkFeature(FEATURES.COMPLAINTS),
    complaintController.deleteComplaint
);

export default router;