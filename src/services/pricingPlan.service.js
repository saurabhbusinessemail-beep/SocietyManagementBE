import { PricingPlan, SocietyPlan, Society, Feature } from '../models';

const calculateCouponDiscount = (couponCode, amount) => {
    if (!couponCode) return { discount: 0, finalAmount: amount, couponCode: null };

    // Define available coupons
    const coupons = {
        'SKFREE': { type: 'percentage', value: 100 }, // 100% off
        'SAVE10': { type: 'percentage', value: 10 },  // 10% off
        'SAVE20': { type: 'percentage', value: 20 },  // 20% off
        'FLAT5000': { type: 'fixed', value: 5000 }      // ₹500 off
    };

    const coupon = coupons[couponCode.toUpperCase()];
    if (!coupon) {
        throw new Error('Invalid coupon code');
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = (amount * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
    }

    // Ensure discount doesn't exceed amount
    discount = Math.min(discount, amount);

    return {
        discount,
        finalAmount: amount - discount,
        couponCode: couponCode.toUpperCase()
    };
};

export const getAllPlans = async () => {
    try {
        const plans = await PricingPlan.find({ isActive: true })
            .sort({ displayOrder: 1, createdAt: 1 });

        return {
            success: true,
            data: plans
        };
    } catch (error) {
        console.error('Error fetching pricing plans:', error);
        throw error;
    }
}

export const getPlanById = async (planId) => {
    try {
        const plan = await PricingPlan.findOne({ id: planId, isActive: true });

        if (!plan) {
            return {
                success: false,
                message: 'Pricing plan not found'
            };
        }

        return {
            success: true,
            data: plan
        };
    } catch (error) {
        console.error('Error fetching pricing plan:', error);
        throw error;
    }
}

export const getAllFeatures = async () => {
    try {
        const features = await Feature.find().sort({ key: 1 });

        return {
            success: true,
            data: features
        };
    } catch (error) {
        console.error('Error fetching features:', error);
        throw error;
    }
}

export const purchase = async (planId, societyId, loggedInUserId, billingCycle = 'yearly', couponCode = null) => {
    // Get the plan
    const plan = await PricingPlan.findOne({ id: planId, isActive: true });
    if (!plan) {
        throw new Error('Plan not found');
    }

    // Get society for flat count
    const society = await Society.findById(societyId).lean();
    if (!society) {
        throw new Error('Society not found');
    }

    const flatCount = society.numberOfFlats || 1;

    // Calculate base amount
    let baseAmount = 0;
    if (plan.price !== 'Free') {
        baseAmount = parseInt(plan.price) * flatCount * 12;
    }

    // Apply coupon if provided
    let discount = 0;
    let finalAmount = baseAmount;
    let appliedCoupon = null;

    if (couponCode) {
        try {
            const couponResult = calculateCouponDiscount(couponCode, baseAmount);
            discount = couponResult.discount;
            finalAmount = couponResult.finalAmount;
            appliedCoupon = couponResult.couponCode;
        } catch (error) {
            throw new Error(`Coupon error: ${error.message}`);
        }
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
            key: f.key,
            name: f.name,
            included: f.included,
            currentUsage: 0,
            limit: f.value && !isNaN(parseInt(f.value)) ? parseInt(f.value) : 0,
            hasLimit: f.value && !isNaN(parseInt(f.value))
        })),
        billingCycle,
        totalAmount: baseAmount,
        discountAmount: discount,
        finalAmount: finalAmount,
        couponCode: appliedCoupon,
        paymentStatus: finalAmount === 0 ? 'paid' : 'pending',
        purchasedBy: loggedInUserId
    });

    return await societyPlan.save();
};

export const currentPlan = async (societyId) => {
    const societyPlan = await SocietyPlan.findOne({
        societyId,
        isActive: true
    }).populate('purchasedBy', 'name email').lean();

    // Get full plan details
    const planDetails = societyPlan ? await PricingPlan.findOne({ id: societyPlan.planId }).lean()
        : await PricingPlan.findOne({ id: 'basic' }).lean();

    // Calculate days used in current billing cycle
    const daysUsed = societyPlan ? Math.floor((Date.now() - new Date(societyPlan.startDate)) / (1000 * 60 * 60 * 24)) : 0;
    const totalDays = 365; // Yearly plan
    const remainingDays = societyPlan ? (totalDays - daysUsed) : 0;
    const usedPercentage = societyPlan ? ((daysUsed / totalDays) * 100) : 0;

    return {
        ...(societyPlan ?? {}),
        planDetails,
        usage: {
            daysUsed,
            remainingDays,
            usedPercentage,
            startDate: societyPlan ? societyPlan.startDate : new Date(),
            endDate: societyPlan ? (societyPlan.endDate || new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000)) : new Date()
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

export const calculateChangePrice = async (societyId, newPlanId, couponCode = null) => {
    // Get current active plan
    const currentPlan = await SocietyPlan.findOne({
        societyId,
        isActive: true
    }).lean();

    // if (!currentPlan) {
    //     throw new Error('No active plan found');
    // }

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
    const currentPlanValue = currentPlan ? (parseInt(currentPlan.price) * flatCount * 12) : 0;
    const daysUsed = currentPlan ? (Math.floor((Date.now() - new Date(currentPlan.startDate)) / (1000 * 60 * 60 * 24))) : 0;
    const totalDays = 365;
    const usedValue = currentPlan ? ((currentPlanValue / totalDays) * daysUsed) : 0;
    const remainingValue = currentPlan ? (currentPlanValue - usedValue) : 0;

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

    // Apply coupon to the amount to pay
    let discount = 0;
    let finalAmount = amountToPay;
    let appliedCoupon = null;

    if (couponCode && amountToPay > 0) {
        try {
            const couponResult = calculateCouponDiscount(couponCode, amountToPay);
            discount = couponResult.discount;
            finalAmount = couponResult.finalAmount;
            appliedCoupon = couponResult.couponCode;

            if (discount > 0) {
                paymentReason += ` (Coupon ${appliedCoupon} applied: -₹${discount})`;
            }
        } catch (error) {
            throw new Error(`Coupon error: ${error.message}`);
        }
    }

    // Check if plan is older than one month (30 days)
    const isOlderThanOneMonth = daysUsed > 30;

    return {
        currentPlan: currentPlan ? {
            id: currentPlan.planId,
            name: currentPlan.planName,
            price: currentPlan.price,
            value: currentPlanValue,
            startDate: currentPlan.startDate,
            daysUsed,
            usedValue,
            remainingValue
        } : undefined,
        newPlan: {
            id: newPlan.id,
            name: newPlan.name,
            price: newPlan.price,
            value: newPlanValue
        },
        flatCount,
        calculation: {
            amountToPay,
            discount,
            finalAmount,
            paymentReason,
            isOlderThanOneMonth,
            daysUsed,
            totalDays,
            usedValue,
            remainingValue,
            newPlanValue,
            couponCode: appliedCoupon
        }
    };
};

export const changePlan = async (societyId, newPlanId, loggedInUserId, billingCycle = 'yearly', paymentMethod, paymentDetails, couponCode = null) => {
    try {
        // Get price calculation with coupon
        const calculation = await calculateChangePrice(societyId, newPlanId, couponCode);

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
                key: f.key,
                name: f.name,
                included: f.included,
                currentUsage: 0,
                limit: f.value && !isNaN(parseInt(f.value)) ? parseInt(f.value) : 0,
                hasLimit: f.value && !isNaN(parseInt(f.value))
            })),
            billingCycle,
            totalAmount: calculation.calculation.amountToPay,
            discountAmount: calculation.calculation.discount || 0,
            finalAmount: calculation.calculation.finalAmount,
            couponCode: calculation.calculation.couponCode,
            paymentStatus: calculation.calculation.finalAmount === 0 ? 'paid' : 'pending',
            purchasedBy: loggedInUserId,
            notes: `Plan changed from previous plan. ${calculation.calculation.paymentReason}`
        });

        await societyPlan.save();

        return societyPlan;
    } catch (error) {
        throw error;
    }
};

export const validateCoupon = async (couponCode, amount) => {
    try {
        const result = calculateCouponDiscount(couponCode, amount);
        return {
            valid: true,
            ...result
        };
    } catch (error) {
        return {
            valid: false,
            message: error.message
        };
    }
};
