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