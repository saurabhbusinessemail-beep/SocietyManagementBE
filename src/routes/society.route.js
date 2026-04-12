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
import { decacheCurrentUser } from '../middlewares/decache.middleware';
import { checkFeature, checkBuildingLimit, checkFlatLimit } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

const router = express.Router();

router.use(userAuth);

// SOCITIES
router.get(
  '/',
  createSocietyFilter,
  societyController.getAllSocieties
);

router.post(
  '/unApproved',
  checkPermissions(['society.add']),
  societyController.getAllUnApprovedSocieties
);

router.post(
  '/mySocietiesForApproval',
  societyController.getMySocietiesForApproval
);

router.post(
  '/sentForApproval',
  newRecordFields,
  decacheCurrentUser,
  societyController.newSociety
);

router.get('/search', societyController.searchSocieties);

router.get(
  '/:societyId',
  societyController.getSociety
);

router.post(
  '/',
  checkPermissions(['society.add']),
  newRecordFields,
  decacheCurrentUser,
  societyController.newSociety
);

router.put(
  '/:societyId',
  checkPermissions(['society.update'], true),
  updateRecordFields,
  decacheCurrentUser,
  societyController.updateSociety
);

router.patch(
  '/:societyId',
  checkPermissions(['society.add'], true),
  decacheCurrentUser,
  societyController.approveRejectSociety
);

router.delete(
  '/:societyId',
  checkPermissions(['society.delete'], true),
  decacheCurrentUser,
  societyController.deleteSociety
);

// Managers
router.post(
  '/:societyId/managers',
  checkPermissions(['manager.add'], true),
  societyController.newSocietyManager
);

router.delete(
  '/:societyId/managers/:managerId',
  checkPermissions(['manager.delete'], true),
  societyController.deleteSocietyManager
);

// Securities
router.get(
  '/:societyId/securities',
  societyController.getSocietySecurities
);

router.delete(
  '/:societyId/securities/:securityId',
  checkPermissions(['society.update'], true),
  societyController.deleteSocietySecurity
);

// Admin Contacts
router.post(
  '/:societyId/adminContacts',
  checkPermissions(['society.adminContact.add'], true),
  societyController.newSocietyAdmin
);

router.delete(
  '/:societyId/adminContacts/:adminId',
  checkPermissions(['adminContact.delete'], true),
  societyController.deleteSocietyAdmin
);

// Buildings
router.get(
  '/:societyId/buildings/:buildingId',
  checkPermissions(['building.view'], true),
  buildingController.getBuilding
);

router.get(
  '/:societyId/buildings',
  buildingController.getBuildingsBySociety
);

router.get(
  '/:societyId/buildingsCount',
  buildingController.getBuildingsCountBySociety
);

router.post(
  '/:societyId/buildings',
  checkPermissions(['building.add'], true),
  newRecordFields,
  checkBuildingLimit,
  buildingController.createBuilding
);

router.put(
  '/:societyId/buildings/:buildingId',
  checkPermissions(['building.update'], true),
  updateRecordFields,
  buildingController.updateBuilding
);

router.delete(
  '/:societyId/buildings/:buildingId',
  checkPermissions(['building.delete'], true),
  buildingController.deleteBuilding
);

// Flats
router.get(
  '/:societyId/buildings/:buildingId/flatsCount',
  flatController.getFlatsCountBySocietyAndBuilding
);

router.get(
  '/:societyId/flatsCount',
  flatController.getFlatsCountBySocietyAndBuilding
);


router.get(
  '/:societyId/buildings/:buildingId/flats',
  flatController.getFlatsBySocietyAndBuilding
);

router.get(
  '/:societyId/flats',
  flatController.getFlatsBySocietyAndBuilding
);

router.post(
  '/:societyId/flats',
  checkPermissions(['flat.add'], true),
  newRecordFields,
  checkFlatLimit,
  flatController.createFlat
);

router.post(
  '/:societyId/flats/bulk',
  checkPermissions(['flat.add'], true),
  checkFlatLimit,
  flatController.bulkCreateFlats
);

router.delete(
  '/:societyId/flats/:flatId',
  checkPermissions(['flat.delete'], true),
  flatController.deleteFlat
);

// Parkings
router.get(
  '/:societyId/buildings/:buildingId/parkings',
  checkPermissions(['parking.view'], true),
  checkFeature(FEATURES.PARKING),
  parkingController.getParkingsBySocietyAndBuilding
);

router.get(
  '/:societyId/flats/:flatId/parkings',
  checkFeature(FEATURES.PARKING),
  parkingController.getParkingsBySocietyAndBuilding
);

router.get(
  '/:societyId/parkings',
  checkPermissions(['parking.view'], true),
  checkFeature(FEATURES.PARKING),
  parkingController.getParkingsBySocietyAndBuilding
);

router.post(
  '/:societyId/parkings',
  checkPermissions(['parking.add'], true),
  newRecordFields,
  checkFeature(FEATURES.PARKING),
  parkingController.createParking
);

router.post(
  '/:societyId/parkings/bulk',
  checkPermissions(['parking.add'], true),
  checkFeature(FEATURES.PARKING),
  parkingController.bulkCreateParkings
);

router.put(
  '/:societyId/parkings/:parkingId',
  checkPermissions(['parking.update'], true),
  updateRecordFields,
  checkFeature(FEATURES.PARKING),
  parkingController.updateParking
);

router.delete(
  '/:societyId/parkings/:parkingId',
  checkPermissions(['parking.delete'], true),
  checkFeature(FEATURES.PARKING),
  parkingController.deleteParking
);

export default router;