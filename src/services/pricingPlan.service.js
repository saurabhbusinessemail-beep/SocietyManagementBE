import { PricingPlan, SocietyPlan, Society, Feature } from '../models';
import { invalidatePlanCache } from './planCache.service'

const calculateCouponDiscount = (couponCode, amount) => {
    if (!couponCode) return { discount: 0, finalAmount: amount, couponCode: null };

    // Define available coupons
    const coupons = {
        'SKFREE': { type: 'percentage', value: 100 }, // 100% off
        'SAVE10': { type: 'percentage', value: 10 },  // 10% off
        'SAVE20': { type: 'percentage', value: 20 },  // 20% off
        'FLAT5000': { type: 'fixed', value: 5000 }      // ₹5000 off
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
    } else if (coupon.type === 'direct') {
        discount = amount - coupon.value;
    }

    // Ensure discount doesn't exceed amount
    discount = Math.min(discount, amount);

    return {
        discount,
        finalAmount: amount - discount,
        couponCode: couponCode.toUpperCase()
    };
};

// Helper function to calculate days between dates
const calculateDaysBetweenDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// Helper function to calculate end date from start date and duration
const calculateEndDate = (startDate, durationValue, durationUnit) => {
    const start = new Date(startDate);
    const end = new Date(start);

    if (durationUnit === 'months') {
        end.setMonth(start.getMonth() + durationValue);
    } else if (durationUnit === 'years') {
        end.setFullYear(start.getFullYear() + durationValue);
    }

    return end;
};

// Helper function to calculate total months from duration
const getTotalMonths = (durationValue, durationUnit) => {
    return durationUnit === 'years' ? durationValue * 12 : durationValue;
};

// Helper function to calculate plan amount based on duration using existing price field
const calculatePlanAmount = (plan, flatCount, durationValue, durationUnit) => {
    // price is per flat per month (e.g., "99" or "199")
    const monthlyPricePerFlat = parseInt(plan.price) || 0;

    // Calculate total months
    const totalMonths = getTotalMonths(durationValue, durationUnit);

    // Calculate base amount: monthly price per flat * number of flats * total months
    let baseAmount = monthlyPricePerFlat * flatCount * totalMonths;

    // Apply duration-based discount if configured
    const durationOption = plan.durationOptions?.find(
        opt => opt.value === durationValue && opt.unit === durationUnit
    );

    if (durationOption?.discount) {
        baseAmount = baseAmount * (1 - durationOption.discount / 100);
    }

    return baseAmount;
};

// Helper function to disable one plan and activate another plan
const changeActivePlan = async (societyId, reason = undefined) => {
    await SocietyPlan.updateOne(
        { societyId, isActive: true },
        {
            $set: {
                isActive: false,
                endDate: new Date(),
                notes: reason
            }
        }
    );
}

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

export const purchase = async (
    planId,
    societyId,
    loggedInUserId,
    durationValue,
    durationUnit,
    startDate = new Date(),
    couponCode = null
) => {
    // Get the plan
    const plan = await PricingPlan.findOne({ id: planId, isActive: true });
    if (!plan) {
        throw new Error('Plan not found');
    }
    if (plan.id !== 'basic' && !durationValue || !durationUnit) {
        throw new Error('Duration value and unit are required');
    }

    // Validate duration option
    const isValidDuration = plan.id === 'basic' || plan.allowedDurations?.[durationUnit]?.includes(durationValue);
    if (!isValidDuration) {
        throw new Error(`Invalid duration: ${durationValue} ${durationUnit} not allowed for this plan`);
    }

    // Get society for flat count
    const society = await Society.findById(societyId).lean();
    if (!society) {
        throw new Error('Society not found');
    }

    const flatCount = society.numberOfFlats || 1;

    // Calculate end date
    const effectiveStartDate = new Date(startDate);
    const endDate = calculateEndDate(effectiveStartDate, durationValue, durationUnit);

    // Calculate base amount based on duration using existing price field
    let baseAmount = calculatePlanAmount(plan, flatCount, durationValue, durationUnit);

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
    if (finalAmount === 0) {
        await changeActivePlan(societyId);
    }

    // Create society plan with duration details
    const societyPlan = new SocietyPlan({
        societyId: societyId,
        planId: plan.id,
        planName: plan.name,
        price: plan.price, // Keep original price string for reference
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
        selectedDuration: {
            value: durationValue,
            unit: durationUnit
        },
        startDate: effectiveStartDate,
        endDate: endDate,
        totalAmount: baseAmount,
        discountAmount: discount,
        finalAmount: finalAmount,
        couponCode: appliedCoupon,
        paymentStatus: finalAmount === 0 ? 'paid' : 'pending',
        purchasedBy: loggedInUserId,
        isActive: finalAmount === 0 ? true : false
    });

    return await societyPlan.save();
};

export const updateRazorpayOrderId = async (societyPlanId, razorpayOrderId) => {
    const updatedPlan = await SocietyPlan.findByIdAndUpdate(
        societyPlanId,
        { razorpayOrderId },
        { new: true }
    );

    if (!updatedPlan) {
        throw new Error(`SocietyPlan with id ${societyPlanId} not found`);
    }

    return updatedPlan;
};

export const updatePaymentStatus = async (societyPlanId, status, razorPayTransaction) => {
    const societyPlan = await SocietyPlan.findById(societyPlanId);
    if (status === 'paid') {
        await changeActivePlan(societyPlan.societyId)
    }
    const updatedPlan = await SocietyPlan.findByIdAndUpdate(
        societyPlanId,
        {
            paymentStatus: status,
            razorPayTransaction: JSON.stringify(razorPayTransaction),
            isActive: true
        },
        { new: true }
    );

    if (!updatedPlan) {
        return undefined;
    }
    invalidatePlanCache(societyPlan.societyId);

    return updatedPlan;
};

export const currentPlan = async (societyId) => {
    const societyPlan = await SocietyPlan.findOne({
        societyId,
        isActive: true
    }).populate('purchasedBy', 'name email').lean();

    if (!societyPlan) {
        // Return default basic plan info
        const basicPlan = await PricingPlan.findOne({ id: 'basic' }).lean();
        return {
            planDetails: basicPlan,
            usage: {
                daysUsed: 0,
                remainingDays: 0,
                usedPercentage: 0,
                startDate: new Date(),
                endDate: new Date()
            }
        };
    }

    // Get full plan details
    const planDetails = await PricingPlan.findOne({ id: societyPlan.planId }).lean();

    // Calculate days used and remaining based on actual dates
    const now = new Date();
    const startDate = new Date(societyPlan.startDate);
    const endDate = new Date(societyPlan.endDate);

    const totalDays = calculateDaysBetweenDates(startDate, endDate);
    const daysUsed = now > endDate ? totalDays : Math.max(0, calculateDaysBetweenDates(startDate, now));
    const remainingDays = Math.max(0, calculateDaysBetweenDates(now, endDate));
    const usedPercentage = (daysUsed / totalDays) * 100;

    // Check if plan is expired
    const isExpired = now > endDate;

    // Calculate total months for the plan
    const totalMonths = societyPlan.selectedDuration ? getTotalMonths(
        societyPlan.selectedDuration.value,
        societyPlan.selectedDuration.unit
    ) : 0;

    return {
        ...societyPlan,
        planDetails,
        isExpired,
        totalMonths,
        usage: {
            daysUsed,
            remainingDays,
            usedPercentage,
            startDate: societyPlan.startDate,
            endDate: societyPlan.endDate,
            totalDays
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
        planDetails: planMap[plan.planId],
        durationInDays: calculateDaysBetweenDates(plan.startDate, plan.endDate),
        totalMonths: plan.selectedDuration ? getTotalMonths(plan.selectedDuration.value, plan.selectedDuration.unit) : 0
    }));

    return {
        data: plansWithDetails,
        total,
        page,
        limit,
        success: true
    };
};

export const calculateChangePrice = async (societyId, newPlanId, newDurationValue, newDurationUnit, couponCode = null) => {
    // Get current active plan
    const currentPlan = await SocietyPlan.findOne({
        societyId,
        isActive: true
    }).lean();

    // Get new plan details
    const newPlan = await PricingPlan.findOne({ id: newPlanId, isActive: true }).lean();
    if (!newPlan) {
        throw new Error('New plan not found');
    }

    // Validate new duration
    const isValidDuration = newPlan.allowedDurations?.[newDurationUnit]?.includes(newDurationValue);
    if (!isValidDuration) {
        throw new Error(`Invalid duration: ${newDurationValue} ${newDurationUnit} not allowed for this plan`);
    }

    // Get society details for flat count
    const society = await Society.findById(societyId).lean();
    if (!society) {
        throw new Error('Society not found');
    }

    const flatCount = society.numberOfFlats || 1;

    let currentPlanValue = 0;
    let remainingValue = 0;
    let daysUsed = 0;
    let totalDays = 0;
    let usedValue = 0;

    if (currentPlan) {
        // Calculate current plan value using its duration
        currentPlanValue = calculatePlanAmount(
            { price: currentPlan.price },
            flatCount,
            currentPlan.selectedDuration.value,
            currentPlan.selectedDuration.unit
        );

        const now = new Date();
        const startDate = new Date(currentPlan.startDate);
        const endDate = new Date(currentPlan.endDate);

        totalDays = calculateDaysBetweenDates(startDate, endDate);
        daysUsed = now > endDate ? totalDays : Math.max(0, calculateDaysBetweenDates(startDate, now));

        usedValue = (currentPlanValue / totalDays) * daysUsed;
        remainingValue = Math.max(0, currentPlanValue - usedValue);
    }

    // Calculate new plan value
    const newPlanValue = calculatePlanAmount(newPlan, flatCount, newDurationValue, newDurationUnit);

    // Calculate difference
    let amountToPay = 0;
    let paymentReason = '';

    if (newPlanValue > remainingValue) {
        amountToPay = newPlanValue - remainingValue;
        paymentReason = 'Paying only the difference amount';
    } else if (newPlanValue < remainingValue) {
        amountToPay = 0;
        paymentReason = 'No payment required (downgrading to lower value plan)';
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

    const isOlderThanOneMonth = daysUsed > 30;

    return {
        currentPlan: currentPlan ? {
            id: currentPlan.planId,
            name: currentPlan.planName,
            price: currentPlan.price,
            duration: currentPlan.selectedDuration,
            value: currentPlanValue,
            startDate: currentPlan.startDate,
            endDate: currentPlan.endDate,
            daysUsed,
            usedValue,
            remainingValue,
            totalDays
        } : undefined,
        newPlan: {
            id: newPlan.id,
            name: newPlan.name,
            price: newPlan.price,
            duration: {
                value: newDurationValue,
                unit: newDurationUnit
            },
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

export const changePlan = async (
    societyId,
    newPlanId,
    loggedInUserId,
    newDurationValue,
    newDurationUnit,
    paymentMethod,
    paymentDetails,
    couponCode = null
) => {
    try {
        // Get price calculation with coupon
        const calculation = await calculateChangePrice(
            societyId,
            newPlanId,
            newDurationValue,
            newDurationUnit,
            couponCode
        );

        // Deactivate current plan
        if (calculation.calculation.finalAmount === 0) {
            await changeActivePlan(societyId, `Plan changed to ${calculation.newPlan.name} on ${new Date().toISOString()}`)
        }

        // Get new plan details
        const newPlan = await PricingPlan.findOne({ id: newPlanId, isActive: true }).lean();

        // Calculate new plan's end date
        const startDate = new Date();
        const endDate = calculateEndDate(startDate, newDurationValue, newDurationUnit);

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
            selectedDuration: {
                value: newDurationValue,
                unit: newDurationUnit
            },
            startDate: startDate,
            endDate: endDate,
            totalAmount: calculation.calculation.amountToPay,
            discountAmount: calculation.calculation.discount || 0,
            finalAmount: calculation.calculation.finalAmount,
            couponCode: calculation.calculation.couponCode,
            paymentStatus: calculation.calculation.finalAmount === 0 ? 'paid' : 'pending',
            purchasedBy: loggedInUserId,
            notes: `Plan changed from previous plan. ${calculation.calculation.paymentReason}`,
            isActive: calculation.calculation.finalAmount === 0 ? true : false
        });

        await societyPlan.save();

        invalidatePlanCache(societyId);
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

// Helper function to get available durations for a plan with calculated prices
export const getPlanDurations = async (planId, societyId = null) => {
    try {
        const plan = await PricingPlan.findOne({ id: planId, isActive: true });
        if (!plan) {
            throw new Error('Plan not found');
        }

        let flatCount = 1; // Default to 1
        if (societyId) {
            const society = await Society.findById(societyId).lean();
            flatCount = society?.numberOfFlats || 1;
        }

        const monthlyPricePerFlat = parseInt(plan.price) || 0;

        // Build duration options with calculated prices
        const durations = {
            months: [],
            years: []
        };

        // Process month options
        if (plan.allowedDurations?.months) {
            durations.months = plan.allowedDurations.months.map(months => {
                const baseAmount = monthlyPricePerFlat * flatCount * months;
                const durationOption = plan.durationOptions?.find(
                    opt => opt.value === months && opt.unit === 'months'
                );

                const discount = durationOption?.discount || 0;
                const finalAmount = baseAmount * (1 - discount / 100);

                return {
                    value: months,
                    unit: 'months',
                    baseAmount,
                    discount,
                    finalAmount,
                    savings: discount > 0 ? baseAmount - finalAmount : 0
                };
            });
        }

        // Process year options
        if (plan.allowedDurations?.years) {
            durations.years = plan.allowedDurations.years.map(years => {
                const totalMonths = years * 12;
                const baseAmount = monthlyPricePerFlat * flatCount * totalMonths;
                const durationOption = plan.durationOptions?.find(
                    opt => opt.value === years && opt.unit === 'years'
                );

                const discount = durationOption?.discount || 0;
                const finalAmount = baseAmount * (1 - discount / 100);

                return {
                    value: years,
                    unit: 'years',
                    baseAmount,
                    discount,
                    finalAmount,
                    savings: discount > 0 ? baseAmount - finalAmount : 0,
                    monthlyEquivalent: finalAmount / totalMonths
                };
            });
        }

        return {
            success: true,
            data: {
                planId: plan.id,
                planName: plan.name,
                monthlyPricePerFlat,
                flatCount,
                durations
            }
        };
    } catch (error) {
        console.error('Error fetching plan durations:', error);
        throw error;
    }
};