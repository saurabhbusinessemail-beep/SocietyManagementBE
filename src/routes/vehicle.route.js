import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import * as vehicleController from '../controllers/vehicle.controller';
import { newRecordFields } from '../middlewares/newRecordFields';

const router = express.Router();
router.use(userAuth);

router.post('/:flatId/get', vehicleController.getVehicles);

router.post('/:flatId/add', newRecordFields, vehicleController.createVehicle);

router.delete('/:id', vehicleController.deleteVehicle);

export default router;