import * as PricingPlanService from '../services/pricingPlan.service';
import * as RazorPayService from '../services/razorpay.service';

export const getAllPlans = async (req, res) => {
    try {
        const result = await PricingPlanService.getAllPlans();

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Error in getAllPlans:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pricing plans',
            error: error.message
        });
    }
};

export const getPlanById = async (req, res) => {
    try {
        const { planId } = req.params;
        const result = await PricingPlanService.getPlanById(planId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Error in getPlanById:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pricing plan',
            error: error.message
        });
    }
};

export const getAllFeatures = async (req, res) => {
    try {
        const result = await PricingPlanService.getAllFeatures();

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Error in getAllFeatures:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch features',
            error: error.message
        });
    }
};

export const purchase = async (req, res, next) => {
    try {
        const {
            planId,
            durationValue,
            durationUnit,
            startDate,
            couponCode
        } = req.body;

        const loggedInUserId = res.locals.user?._id;

        if (!loggedInUserId) {
            throw new Error('User must be logged in to purchase a plan for society.');
        }

        let data = await PricingPlanService.purchase(
            planId,
            req.params.societyId,
            loggedInUserId,
            durationValue,
            durationUnit,
            startDate,
            couponCode
        );

        if (data.finalAmount > 0) {
            const order = await RazorPayService.createOrder({
                orderId: data._id,
                amount: data.finalAmount,
                notes: {
                    type: 'SOCIETY_PLAN'
                },
            });

            if (order) {
                data = await PricingPlanService.updateRazorpayOrderId(data._id, order.id);
            }
        }

        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
};

export const currentPlan = async (req, res, next) => {
    try {
        const data = await PricingPlanService.currentPlan(req.params.societyId)

        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const getPlanHistory = async (req, res, next) => {
    try {
        const { societyId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const data = await PricingPlanService.getPlanHistory(societyId, parseInt(page), parseInt(limit));

        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const calculateChangePrice = async (req, res, next) => {
    try {
        const {
            societyId,
            newPlanId,
            durationValue,
            durationUnit,
            couponCode
        } = req.body;

        if (!durationValue || !durationUnit) {
            throw new Error('Duration value and unit are required');
        }

        const data = await PricingPlanService.calculateChangePrice(
            societyId,
            newPlanId,
            durationValue,
            durationUnit,
            couponCode
        );

        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const changePlan = async (req, res, next) => {
    try {
        const { societyId } = req.params;
        const {
            newPlanId,
            durationValue,
            durationUnit,
            paymentMethod,
            paymentDetails,
            couponCode
        } = req.body;

        const loggedInUserId = res.locals.user?._id;

        if (!loggedInUserId) {
            throw new Error('User must be logged in to change plan');
        }

        if (!durationValue || !durationUnit) {
            throw new Error('Duration value and unit are required');
        }

        let data = await PricingPlanService.changePlan(
            societyId,
            newPlanId,
            loggedInUserId,
            durationValue,
            durationUnit,
            paymentMethod,
            paymentDetails,
            couponCode
        );

        if (data.finalAmount > 0) {
            const order = await RazorPayService.createOrder({
                orderId: data._id,
                amount: data.finalAmount,
                notes: {
                    type: 'SOCIETY_PLAN'
                },
            });

            if (order) {
                data = await PricingPlanService.updateRazorpayOrderId(data._id, order.id);
            }
        }

        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const validateCoupon = async (req, res, next) => {
    try {
        const { couponCode, amount } = req.body;
        const data = await PricingPlanService.validateCoupon(couponCode, amount);

        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const getPlanDurations = async (req, res, next) => {
    try {
        const { planId } = req.params;
        const { societyId } = req.query; // Optional: pass societyId to calculate with actual flat count

        const data = await PricingPlanService.getPlanDurations(planId, societyId);
        res.json(data);
    } catch (err) {
        next(err);
    }
};