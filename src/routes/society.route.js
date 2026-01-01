import express from 'express';
import * as societyController from '../controllers/society.controller';
import * as buildingController from '../controllers/building.controller';
import * as flatController from '../controllers/flat.controller';
import * as parkingController from '../controllers/parking.controller';
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
  '/:id/buildings/:buildingId',
  checkPermissions(['building.view'], true),
  buildingController.getBuilding
);

router.get(
  '/:id/buildings',
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

// Flats
router.get(
  '/:id/buildings/:buildingId/flats',
  flatController.getFlatsBySocietyAndBuilding
);
router.get(
  '/:id/flats',
  flatController.getFlatsBySocietyAndBuilding
);

router.post(
  '/:id/flats',
  checkPermissions(['flat.add'], true),
  newRecordFields,
  flatController.createFlat
);
router.post(
  '/:id/flats/bulk',
  checkPermissions(['flat.add'], true),
  flatController.bulkCreateFlats
);

router.delete(
  '/:id/flats/:flatId',
  checkPermissions(['flat.delete'], true),
  flatController.deleteFlat
);

// Parkings
router.get(
  '/:id/buildings/:buildingId/parkings',
  checkPermissions(['parking.view'], true),
  parkingController.getParkingsBySocietyAndBuilding
);
router.get(
  '/:id/parkings',
  checkPermissions(['parking.view'], true),
  parkingController.getParkingsBySocietyAndBuilding
);

router.post(
  '/:id/parkings',
  checkPermissions(['parking.add'], true),
  newRecordFields,
  parkingController.createParking
);
router.post(
  '/:id/parkings/bulk',
  checkPermissions(['parking.add'], true),
  parkingController.bulkCreateParkings
);

router.put(
  '/:id/parkings/:parkingId',
  checkPermissions(['parking.update'], true),
  updateRecordFields,
  parkingController.updateParking
);

router.delete(
  '/:id/parkings/:parkingId',
  checkPermissions(['parking.delete'], true),
  parkingController.deleteParking
);

export default router;
