import express from 'express';
import * as societyController from '../controllers/society.controller';
import { userAuth } from '../middlewares/auth.middleware';
import {
  attachSociety,
  checkPermissions,
  createSocietyFilter
} from '../middlewares/society.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { updateRecordFields } from '../middlewares/updateRecordFields';

const router = express.Router();

router.use(userAuth);
router.use(attachSociety);

router.get(
  '/',
  checkPermissions(['society.view']),
  createSocietyFilter,
  societyController.getAllSocieties
);

router.get('/search', societyController.searchSocieties);

router.get(
  '/:id',
  checkPermissions(['society.view'], 'societyId'),
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
  checkPermissions(['society.update']),
  updateRecordFields,
  societyController.updateSociety
);

router.delete(
  '/:id',
  checkPermissions(['society.delete']),
  societyController.deleteSociety
);

router.post(
  '/:id/managers',
  checkPermissions(['adminContact.add']),
  societyController.newSocietyManager
);

router.delete(
  '/:id/managers/:managerId',
  checkPermissions(['adminContact.delete']),
  societyController.deleteSocietyManager
);

export default router;
