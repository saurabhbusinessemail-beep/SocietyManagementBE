import express from 'express';
import * as tenantDocumentController from '../controllers/tenantDocument.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { updateRecordFields } from '../middlewares/updateRecordFields';
import { checkFeature } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

const router = express.Router();

router.use(userAuth);
router.use(checkFeature(FEATURES.TENANT_MANAGEMENT));

router.post('/', newRecordFields, tenantDocumentController.createDocument);
router.get('/', tenantDocumentController.getDocuments);
router.patch('/:id/status', updateRecordFields, tenantDocumentController.updateDocumentStatus);
router.delete('/:id', tenantDocumentController.deleteDocument);
router.post('/remind', tenantDocumentController.sendReminder);
router.post('/remind-all', tenantDocumentController.sendReminderToAll);
router.get('/stats/:flatId', tenantDocumentController.getDocumentStats);

export default router;
