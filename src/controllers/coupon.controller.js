const couponService = require('../services/coupon.service');

/**
 * Create a new coupon
 * POST /api/coupons
 */
export const createCoupon = async (req, res, next) => {
    try {
        const coupon = await couponService.createCoupon(req.body);
        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get coupon by code
 * GET /api/coupons/:code
 */
export const getCoupon = async (req, res, next) => {
    try {
        const { code } = req.params;
        const coupon = await couponService.getCouponByCode(code);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }
        res.status(200).json({
            success: true,
            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a coupon
 * PUT /api/coupons/:code
 */
export const updateCoupon = async (req, res, next) => {
    try {
        const { code } = req.params;
        const coupon = await couponService.updateCoupon(code, req.body);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Coupon updated successfully',
            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a coupon
 * DELETE /api/coupons/:code
 */
export const deleteCoupon = async (req, res, next) => {
    try {
        const { code } = req.params;
        const coupon = await couponService.deleteCoupon(code);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Coupon deleted successfully',
            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List all coupons (with optional filtering)
 * GET /api/coupons?isActive=true&planId=premium
 */
export const listCoupons = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }
        if (req.query.planId) {
            filter.planId = req.query.planId;
        }
        const coupons = await couponService.listCoupons(filter);
        res.status(200).json({
            success: true,
            count: coupons.length,
            data: coupons,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Calculate discount using a coupon
 * POST /api/coupons/calculate-discount
 * Body: { couponCode, amount, planId (optional) }
 */
export const calculateDiscount = async (req, res, next) => {
    try {
        const { couponCode, amount, planId } = req.body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required',
            });
        }

        const result = await couponService.calculateDiscount(couponCode, amount, planId);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        // Handle specific service errors with appropriate status codes
        if (error.message === 'Invalid coupon code') {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === 'Coupon is inactive') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message.startsWith('Coupon is not valid for plan')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};
