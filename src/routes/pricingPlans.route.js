import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import * as pricingController from '../controllers/pricingPlan.controller';

const router = express.Router();
router.use(userAuth);

// Purchase a plan for a society
router.post('/purchase/:societyId', pricingController.purchase);

// Get society's current active plan
router.get('/current-plan/:societyId', pricingController.currentPlan);

export default router;