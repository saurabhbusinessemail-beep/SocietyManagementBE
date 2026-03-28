import { SocietyPlan, PricingPlan, Society } from '../models';
import NodeCache from 'node-cache';

const planCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const getActivePlan = async (societyId, forceRefresh = false) => {
    const cacheKey = `plan:${societyId}`;

    if (!forceRefresh) {
        const cached = planCache.get(cacheKey);
        if (cached) {
            const nowDate = new Date();
            const startDate = new Date(cached.startDate);
            const endDate = cached.endDate ? new Date(cached.endDate) : null;
            const isStarted = startDate <= nowDate;
            const isNotExpired = !endDate || endDate >= nowDate;

            if (isStarted && isNotExpired) {
                return cached;
            }
        }
    }

    const now = new Date();
    const query = {
        societyId,
        isActive: true,
        startDate: { $lte: now },
        $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } }
        ]
    };
    let plan = await SocietyPlan.findOne(query).lean();

    // if no plan found then check for basic plan is active
    if (!plan) {
        const query1 = {
            societyId,
            isActive: true
        }
        plan = await SocietyPlan.findOne(query1).lean();
    }

    if (!plan) {
        plan = (await createDummySocietyPlan(societyId)).toObject()
    }

    plan.featureMap = plan.features.reduce((map, feature) => {
        map[feature.key] = feature;
        return map;
    }, {});

    planCache.set(cacheKey, plan);

    return plan;
};

export const checkFeatureAccess = async (societyId, featureKey) => {
    const plan = await getActivePlan(societyId);

    if (!plan) {
        return {
            allowed: false,
            reason: 'No active plan found',
            code: 'NO_PLAN'
        };
    }

    const feature = plan.featureMap?.[featureKey];

    if (!feature || !feature.included) {
        return {
            allowed: false,
            reason: `Feature not included in ${plan.planName} plan`,
            code: 'FEATURE_NOT_INCLUDED',
            planName: plan.planName
        };
    }

    return {
        allowed: true,
        feature,
        planName: plan.planName,
        plan
    };
};

export const invalidatePlanCache = (societyId) => {
    planCache.del(`plan:${societyId}`);
};

export const createDummySocietyPlan = async (societyId) => {
    try {
        // Find the Basic pricing plan
        const basicPlan = await PricingPlan.findOne({ id: 'basic' }).lean();

        if (!basicPlan) {
            throw new Error('Basic pricing plan not found');
        }

        // Find the society
        const society = await Society.findById(societyId);
        if (!society) {
            throw new Error('Society not found');
        }

        // Convert PricingPlan features to PurchasedFeature format
        const purchasedFeatures = basicPlan.features.map(feature => {
            // Extract limit from value if it contains a number
            let limit = 0;
            let hasLimit = false;
            if (feature.key === 'number_of_buildings') {
                limit = 1;
                hasLimit = true;
            } else if (feature.key === 'number_of_flats') {
                limit = 10;
                hasLimit = true;
            } else if (feature.value && !isNaN(parseInt(feature.value))) {
                limit = parseInt(feature.value);
                hasLimit = true;
            }

            return {
                key: feature.key,
                name: feature.name,
                included: feature.included,
                currentUsage: 0,
                limit: limit,
                hasLimit: hasLimit
            };
        });

        // Create the SocietyPlan
        const societyPlan = new SocietyPlan({
            societyId: society._id,
            planId: basicPlan.id,
            planName: basicPlan.name,
            price: basicPlan.price,
            period: basicPlan.period || 'forever',
            featureCount: `${basicPlan.features.filter(f => f.included).length}/${basicPlan.features.length}`,
            features: purchasedFeatures,
            startDate: new Date(),
            endDate: null, // No end date for free plan
            isActive: true,
            autoRenew: false,
            billingCycle: 'yearly',
            totalAmount: 0,
            discountAmount: 0,
            finalAmount: 0,
            paymentStatus: 'paid',
            notes: 'Basic plan auto created'
        });

        await societyPlan.save();

        console.log(`✅ Basic plan auto created for society: ${society.societyName}`);
        return societyPlan;

    } catch (error) {
        console.error('❌ Error creating dummy society plan:', error);
        throw error;
    }
};