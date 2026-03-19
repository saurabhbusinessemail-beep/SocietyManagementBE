import express from 'express';
import * as gateEntryController from '../controllers/gateentry.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { checkFeature } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

const router = express.Router();
router.use(userAuth);

// Routes with societyId in request body (POST /getGateEntries has societyId in body)
router.post('/',
    newRecordFields,
    checkFeature(FEATURES.GATE_ENTRIES),
    gateEntryController.createGateEntry
);

router.post('/getGateEntries',
    checkFeature(FEATURES.GATE_ENTRIES),
    gateEntryController.getGateEntries
);

router.post('/changeStatus/:gateEntryId',
    checkFeature(FEATURES.GATE_ENTRIES),
    gateEntryController.updateGateEntryStatus
);

// Routes without societyId - feature check will be done in service by fetching gate entry
router.get('/:gateEntryId', gateEntryController.getGateEntry);

router.get('/resendNotification/:gateEntryId', gateEntryController.resendGateEntryRequestNotification);

router.get('/markGateExit/:gateEntryId', gateEntryController.markGateExit);

router.delete('/:gateEntryId', gateEntryController.deleteGateEntry);

export default router;