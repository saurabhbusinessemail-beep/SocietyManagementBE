import { PricingPlan, SocietyPlan } from '../models';

export const purchase = async (planId, societyId, loggedInUserId, billingCycle = 'yearly') => {
    // Get the plan
    const plan = await PricingPlan.findOne({ id: planId, isActive: true });
    if (!plan) {
        throw new Error('Plan not found');
    }

    // Check if society already has an active plan
    const existingPlan = await SocietyPlan.findOne({
        societyId: societyId,
        isActive: true
    });

    if (existingPlan) {
        // Deactivate old plan
        existingPlan.isActive = false;
        await existingPlan.save();
    }

    // Create society plan with essential details only
    const societyPlan = new SocietyPlan({
        societyId: societyId,
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        period: plan.period,
        featureCount: plan.featureCount,
        features: plan.features.map(f => ({
            featureKey: f.name.toLowerCase().replace(/\s+/g, '_'), // generate key from name
            name: f.name,
            included: f.included,
            currentUsage: 0,
            limit: f.value && !isNaN(parseInt(f.value)) ? parseInt(f.value) : 0,
            hasLimit: f.value && !isNaN(parseInt(f.value))
        })),
        billingCycle,
        purchasedBy: loggedInUserId
    });

    return await societyPlan.save();
};

export const currentPlan = async (societyId) => {
    const societyPlan = await SocietyPlan.findOne({
        societyId: req.params.societyId,
        isActive: true
    }).populate('purchasedBy');

    if (!societyPlan) {
        throw new Error('No active plan found');
    }

    return societyPlan;
};
