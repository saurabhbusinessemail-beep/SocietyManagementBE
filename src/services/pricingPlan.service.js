import { PricingPlan, SocietyPlan, Society } from '../models';

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
        societyId,
        isActive: true
    }).populate('purchasedBy', 'name email').lean();

    if (!societyPlan) {
        throw new Error('No active plan found for this society');
    }

    // Get full plan details
    const planDetails = await PricingPlan.findOne({ id: societyPlan.planId }).lean();

    // Calculate days used in current billing cycle
    const daysUsed = Math.floor((Date.now() - new Date(societyPlan.startDate)) / (1000 * 60 * 60 * 24));
    const totalDays = 365; // Yearly plan
    const remainingDays = totalDays - daysUsed;
    const usedPercentage = (daysUsed / totalDays) * 100;

    return {
        ...societyPlan,
        planDetails,
        usage: {
            daysUsed,
            remainingDays,
            usedPercentage,
            startDate: societyPlan.startDate,
            endDate: societyPlan.endDate || new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000)
        }
    };
};

export const getPlanHistory = async (societyId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
        SocietyPlan.find({ societyId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('purchasedBy', 'name email')
            .lean(),
        SocietyPlan.countDocuments({ societyId })
    ]);

    // Get plan details for each
    const planIds = [...new Set(plans.map(p => p.planId))];
    const planDetails = await PricingPlan.find({ id: { $in: planIds } }).lean();
    const planMap = planDetails.reduce((acc, plan) => ({ ...acc, [plan.id]: plan }), {});

    const plansWithDetails = plans.map(plan => ({
        ...plan,
        planDetails: planMap[plan.planId]
    }));

    return {
        data: plansWithDetails,
        total,
        page,
        limit,
        success: true
    };
};

export const calculateChangePrice = async (societyId, newPlanId) => {
    // Get current active plan
    const currentPlan = await SocietyPlan.findOne({
        societyId,
        isActive: true
    }).lean();

    if (!currentPlan) {
        throw new Error('No active plan found');
    }

    // Get new plan details
    const newPlan = await PricingPlan.findOne({ id: newPlanId, isActive: true }).lean();
    if (!newPlan) {
        throw new Error('New plan not found');
    }

    // Get society details for flat count
    const society = await Society.findById(societyId).lean();
    if (!society) {
        throw new Error('Society not found');
    }

    const flatCount = society.numberOfFlats || 1;

    // Calculate current plan value (pro-rated)
    const currentPlanValue = parseInt(currentPlan.price) * flatCount * 12;
    const daysUsed = Math.floor((Date.now() - new Date(currentPlan.startDate)) / (1000 * 60 * 60 * 24));
    const totalDays = 365;
    const usedValue = (currentPlanValue / totalDays) * daysUsed;
    const remainingValue = currentPlanValue - usedValue;

    // Calculate new plan value
    const newPlanValue = parseInt(newPlan.price) * flatCount * 12;

    // Calculate difference
    let amountToPay = 0;
    let paymentReason = '';

    if (newPlanValue > remainingValue) {
        amountToPay = newPlanValue - remainingValue;
        paymentReason = 'Paying only the difference amount (upgrading to higher plan)';
    } else if (newPlanValue < remainingValue) {
        amountToPay = 0;
        paymentReason = 'No payment required (downgrading to lower plan)';
    } else {
        amountToPay = 0;
        paymentReason = 'No payment required (same plan value)';
    }

    // Check if plan is older than one month (30 days)
    const isOlderThanOneMonth = daysUsed > 30;

    return {
        currentPlan: {
            id: currentPlan.planId,
            name: currentPlan.planName,
            price: currentPlan.price,
            value: currentPlanValue,
            startDate: currentPlan.startDate,
            daysUsed,
            usedValue,
            remainingValue
        },
        newPlan: {
            id: newPlan.id,
            name: newPlan.name,
            price: newPlan.price,
            value: newPlanValue
        },
        flatCount,
        calculation: {
            amountToPay,
            paymentReason,
            isOlderThanOneMonth,
            daysUsed,
            totalDays,
            usedValue,
            remainingValue,
            newPlanValue
        }
    };
};

export const changePlan = async (societyId, newPlanId, loggedInUserId, billingCycle = 'yearly', paymentMethod, paymentDetails) => {
    try {
        // Get price calculation
        const calculation = await calculateChangePrice(societyId, newPlanId);

        // Deactivate current plan
        await SocietyPlan.updateOne(
            { societyId, isActive: true },
            {
                $set: {
                    isActive: false,
                    endDate: new Date(),
                    notes: `Plan changed to ${calculation.newPlan.name} on ${new Date().toISOString()}`
                }
            }
        );

        // Get new plan details
        const newPlan = await PricingPlan.findOne({ id: newPlanId, isActive: true }).lean();

        // Create new plan
        const societyPlan = new SocietyPlan({
            societyId,
            planId: newPlan.id,
            planName: newPlan.name,
            price: newPlan.price,
            period: newPlan.period,
            featureCount: newPlan.featureCount,
            features: newPlan.features.map(f => ({
                featureKey: f.name.toLowerCase().replace(/\s+/g, '_'),
                name: f.name,
                included: f.included,
                currentUsage: 0,
                limit: f.value && !isNaN(parseInt(f.value)) ? parseInt(f.value) : 0,
                hasLimit: f.value && !isNaN(parseInt(f.value))
            })),
            billingCycle,
            totalAmount: calculation.calculation.amountToPay,
            paymentStatus: calculation.calculation.amountToPay === 0 ? 'paid' : 'pending',
            purchasedBy: loggedInUserId,
            notes: `Plan changed from previous plan. ${calculation.calculation.paymentReason}`
        });

        await societyPlan.save();

        // If payment is required, you would integrate payment gateway here
        if (calculation.calculation.amountToPay > 0) {
            // Integrate with payment gateway
            // Update payment status after success
        }

        return societyPlan;
    } catch (error) {
        throw error;
    } finally {
    }
};
