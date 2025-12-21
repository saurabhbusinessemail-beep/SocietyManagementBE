import express from 'express';
import * as buildingController from '../controllers/building.controller';
import { userAuth } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(userAuth);

router.post('/', buildingController.createBuilding); // societyId in body
router.post('/bulk', buildingController.bulkCreateBuildings); // societyId in body

router.get('/', buildingController.getBuildingsBySociety); // societyId query/body
router.get('/:id', buildingController.getBuildingById);

router.put('/:id', buildingController.updateBuilding);
router.delete('/:id', buildingController.deleteBuilding);

// manager CRUD
router.put('/:id/manager', buildingController.updateBuildingManager);


export default router;