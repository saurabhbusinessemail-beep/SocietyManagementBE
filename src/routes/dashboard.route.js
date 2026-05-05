import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { userAuth } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/approvals', userAuth, dashboardController.getPendingApprovals);

export default router;
