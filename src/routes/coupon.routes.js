const express = require('express');
import { userAuth } from '../middlewares/auth.middleware';
const couponController = require('../controllers/coupon.controller');

const router = express.Router();
router.use(userAuth);

// Public routes (or protected by auth middleware as needed)
router.post('/', couponController.createCoupon);
router.get('/', couponController.listCoupons);
router.get('/:code', couponController.getCoupon);
router.put('/:code', couponController.updateCoupon);
router.delete('/:code', couponController.deleteCoupon);
router.post('/calculate-discount', couponController.calculateDiscount);

export default router;