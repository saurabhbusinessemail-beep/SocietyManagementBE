import express from 'express';
import * as societyController from '../controllers/society.controller';
import { userAuth } from '../middlewares/auth.middleware';

const router = express.Router();

// router.use(auth);

router.get('/', userAuth, societyController.getAllSocieties);
router.get('/search', userAuth, societyController.searchSocieties);
router.get('/:id', userAuth, societyController.getSociety);
router.post('/', userAuth, societyController.newSociety);
router.put('/:id', userAuth, societyController.updateSociety);
router.delete('/:id', userAuth, societyController.deleteSociety);

export default router;
