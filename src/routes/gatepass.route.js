import express from 'express';
import * as gatePassController from '../controllers/gatepass.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { updateRecordFields } from '../middlewares/updateRecordFields';

const router = express.Router();
router.use(userAuth);

router.get('/:id', gatePassController.getGatePass);

router.get('/validateGatePass/:gatePassId', gatePassController.validateGatePass);

router.post('/myGatePasses', gatePassController.getGatePasses);

router.post('/validateOTP', gatePassController.validateOTP);

router.post('/', newRecordFields, gatePassController.createGatePass);

router.put('/:id', updateRecordFields, gatePassController.updateGatePass);

router.delete('/:id', gatePassController.deleteGatePass);


export default router;