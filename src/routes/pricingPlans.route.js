import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import * as pricingController from '../controllers/pricingPlan.controller';

const router = express.Router();
router.use(userAuth);

// Purchase a plan for a society
router.post('/purchase/:societyId', pricingController.purchase);

// Get society's current active plan
router.get('/current-plan/:societyId', pricingController.currentPlan);

// Get plan history for society
router.get('/history/:societyId', pricingController.getPlanHistory);

// Calculate price for changing plan
router.post('/calculate-change', pricingController.calculateChangePrice);

// Change plan
router.post('/change/:societyId', pricingController.changePlan);

// Change plan
router.post('/validate-coupon', pricingController.validateCoupon);

export default router;