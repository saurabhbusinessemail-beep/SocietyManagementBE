import express from 'express';
import * as gateEntryController from '../controllers/gateentry.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';

const router = express.Router();
router.use(userAuth);

router.get('/:gateEntryId', gateEntryController.getGateEntry);

router.post('/', newRecordFields, gateEntryController.createGateEntry);

router.post('/getGateEntries', gateEntryController.getGateEntries);

router.post('/changeStatus/:gateEntryId', gateEntryController.updateGateEntryStatus);

router.delete('/:gateEntryId', gateEntryController.deleteGateEntry);


export default router;