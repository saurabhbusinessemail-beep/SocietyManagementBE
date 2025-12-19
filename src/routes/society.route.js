import express from 'express';
import * as societyController from '../controllers/society.controller';
import { userAuth } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(userAuth);

router.get('/', societyController.getAllSocieties);
router.get('/search', societyController.searchSocieties);
router.get('/:id', societyController.getSociety);
router.post('/', societyController.newSociety);
router.put('/:id', societyController.updateSociety);
router.put('/:id/secretaries', updateSocietySecretaries);
router.delete('/:id', societyController.deleteSociety);

export default router;
