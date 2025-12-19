import express from 'express';
import * as flatController from '../controllers/flat.controller';
import { userAuth } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(userAuth);


router.post('/', flatController.createFlat);                      // societyId + optional buildingId
router.post('/bulk', flatController.bulkCreateFlats);

router.get('/', flatController.getFlats);                         // societyId + optional buildingId
router.get('/:id', flatController.getFlatById);

router.put('/:id', flatController.updateFlat);
router.delete('/:id', flatController.deleteFlat);


export default router;