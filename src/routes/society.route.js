import express from 'express';
import * as societyController from '../controllers/society.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { checkPermissions } from '../middlewares/permission.middleware';

const router = express.Router();

router.use(userAuth);

router.get('/', checkPermissions(['society.view']), societyController.getAllSocieties);
router.get('/search', checkPermissions(['society.view']), societyController.searchSocieties);
router.get('/:id', checkPermissions(['society.view']), societyController.getSociety);
router.post('/', checkPermissions(['society.adds']), societyController.newSociety);
router.put('/:id', checkPermissions(['society.update']), societyController.updateSociety);
router.put('/:id/secretaries', checkPermissions(['society.update']), societyController.updateSocietySecretaries);
router.delete('/:id', checkPermissions(['society.society_delete']), societyController.deleteSociety);

export default router;
