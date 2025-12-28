import express from 'express';
import * as societyController from '../controllers/society.controller';
import * as buildingController from '../controllers/building.controller';
import { userAuth } from '../middlewares/auth.middleware';
import {
  checkPermissions,
  createSocietyFilter
} from '../middlewares/society.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { updateRecordFields } from '../middlewares/updateRecordFields';

const router = express.Router();

router.use(userAuth);

// SOCITIES
router.get(
  '/',
  checkPermissions(['society.view']),
  createSocietyFilter,
  societyController.getAllSocieties
);

router.get('/search', societyController.searchSocieties);

router.get(
  '/:id',
  checkPermissions(['society.view'], true),
  societyController.getSociety
);

router.post(
  '/',
  checkPermissions(['society.add']),
  newRecordFields,
  societyController.newSociety
);

router.put(
  '/:id',
  checkPermissions(['society.update'], true),
  updateRecordFields,
  societyController.updateSociety
);

router.delete(
  '/:id',
  checkPermissions(['society.delete'], true),
  societyController.deleteSociety
);

// Managers
router.post(
  '/:id/managers',
  checkPermissions(['society.adminContact.add'], true),
  societyController.newSocietyManager
);

router.delete(
  '/:id/managers/:managerId',
  checkPermissions(['adminContact.delete'], true),
  societyController.deleteSocietyManager
);

// Buildings
router.get(
  '/:id/buildings',
  checkPermissions(['building.view'], true),
  buildingController.getBuildingsBySociety
);

router.post(
  '/:id/buildings',
  checkPermissions(['building.add'], true),
  newRecordFields,
  buildingController.createBuilding
);

router.put(
  '/:id/buildings/:buildingId',
  checkPermissions(['building.update'], true),
  updateRecordFields,
  buildingController.updateBuilding
);

router.delete(
  '/:id/buildings/:buildingId',
  checkPermissions(['building.delete'], true),
  buildingController.deleteBuilding
);

export default router;
