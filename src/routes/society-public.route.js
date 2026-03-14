import express from 'express';
const router = express.Router();
import * as societyController from '../controllers/society.controller';

router.post(
    '/sentForApproval',
    societyController.newSociety
);

export default router;