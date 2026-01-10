import express from 'express';
import * as gateEntryController from '../controllers/gateentry.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';

const router = express.Router();
router.use(userAuth);

router.get('/:id', gateEntryController.getGateEntry);

router.get('/', gateEntryController.getGateEntries);

router.post('/', newRecordFields, gateEntryController.createGateEntry);

router.post('/:id/changeStatus', gateEntryController.updateGateEntryStatus);

router.delete('/:id', gateEntryController.deleteGateEntry);
// GatePass

export default router;