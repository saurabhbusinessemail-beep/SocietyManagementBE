import * as PricingPlanService from '../services/pricingPlan.service';

export const purchase = async (req, res, next) => {
    try {
        const { planId, billingCycle = 'yearly' } = req.body;
        const loggedInUserId = res.locals.user?._id;

        if (!loggedInUserId)
            throw new Error('User must be logged in to purchase a plan for society.');

        const data = await PricingPlanService.purchase(planId, req.params.societyId, loggedInUserId, billingCycle)
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
        const { societyId, newPlanId } = req.body;
        const data = await PricingPlanService.calculateChangePrice(societyId, newPlanId);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const changePlan = async (req, res, next) => {
    try {
        const { societyId } = req.params;
        const { newPlanId, billingCycle = 'yearly', paymentMethod, paymentDetails } = req.body;
        const loggedInUserId = res.locals.user?._id;

        if (!loggedInUserId) {
            throw new Error('User must be logged in to change plan');
        }

        const data = await PricingPlanService.changePlan(societyId, newPlanId, loggedInUserId, billingCycle, paymentMethod, paymentDetails);
        res.json(data);
    } catch (err) {
        next(err);
    }
};