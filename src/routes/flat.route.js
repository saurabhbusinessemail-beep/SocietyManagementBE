import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import * as flatController from '../controllers/flat.controller';

const router = express.Router();
router.use(userAuth);

router.get('/myFlats', flatController.myFlats);

router.get('/:id/myFlats', flatController.myFlats);

export default router;
