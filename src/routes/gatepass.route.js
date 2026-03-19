// routes/gatepass.routes.js
import express from 'express';
import * as gatePassController from '../controllers/gatepass.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { updateRecordFields } from '../middlewares/updateRecordFields';
import { checkFeature } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

const router = express.Router();
router.use(userAuth);

// Routes with societyId in request body
router.post('/myGatePasses',
    checkFeature(FEATURES.SMART_GATE_PASS),
    gatePassController.getGatePasses
);

router.post('/validateOTP',
    checkFeature(FEATURES.SMART_GATE_PASS),
    gatePassController.validateOTP
);

router.post('/',
    newRecordFields,
    checkFeature(FEATURES.SMART_GATE_PASS),
    gatePassController.createGatePass
);

// Routes without societyId - will fetch gate pass to get societyId
router.get('/:id', gatePassController.getGatePass);

router.get('/validateGatePass/:gatePassId', gatePassController.validateGatePass);

router.put('/:id',
    updateRecordFields,
    gatePassController.updateGatePass
);

router.delete('/:id', gatePassController.deleteGatePass);

export default router;