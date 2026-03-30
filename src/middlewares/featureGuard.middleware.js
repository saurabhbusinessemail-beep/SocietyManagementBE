import { getActivePlan, checkFeatureAccess } from '../services/planCache.service';
import { Building, Flat } from '../models';

export const checkFeature = (featureKey) => {
    return async (req, res, next) => {
        try {
            const societyId = req.params.societyId || req.body.societyId || req.query.societyId;

            if (!societyId) {
                return next();
            }

            const result = await checkFeatureAccess(societyId, featureKey);

            if (!result.allowed) {
                return res.status(403).json({
                    success: false,
                    code: result.code,
                    message: result.reason,
                    plan: result.planName
                });
            }

            req.featureInfo = result;
            req.societyPlan = result.plan;

            next();
        } catch (error) {
            console.error('Feature guard error:', error);
            next(error);
        }
    };
};

export const checkBuildingLimit = async (req, res, next) => {
    try {
        const societyId = req.params.societyId || req.body.societyId;

        if (!societyId) {
            return next();
        }

        const plan = await getActivePlan(societyId);

        if (!plan || plan.planId === 'basic') {
            const buildingCount = await Building.countDocuments({ societyId });
            const feature = plan?.featureMap?.number_of_buildings;
            const limit = feature?.limit || 1;

            if (buildingCount >= limit) {
                return res.status(403).json({
                    success: false,
                    code: 'BUILDING_LIMIT_EXCEEDED',
                    message: `Your plan allows only ${limit} building(s). Please upgrade to add more.`,
                    plan: plan?.planName || 'No active plan',
                    limit,
                    current: buildingCount
                });
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const checkFlatLimit = async (req, res, next) => {
    try {
        const societyId = req.params.societyId || req.body.societyId;

        if (!societyId) {
            return next();
        }
        const limitError = await flatLimitExceeded(societyId);
        if (limitError) {
            return res.status(403).json(limitError);
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const flatLimitExceeded = async (societyId, incominCount = 1) => {
    const plan = await getActivePlan(societyId);

    // if (!plan || plan.planId === 'basic') {
    const flatCount = await Flat.countDocuments({ societyId });
    const feature = plan?.featureMap?.number_of_flats;
    const limit = plan.flatsCount ?? (feature?.limit || 10);

    console.log({ flatCount, incominCount, limit })
    if ((flatCount + incominCount) > limit) {
        return {
            success: false,
            code: 'FLAT_LIMIT_EXCEEDED',
            message: `Your plan allows only ${limit} flats. Please upgrade your plan to add more.`,
            plan: plan?.planName || 'No active plan',
            limit,
            current: flatCount
        };
    }
    // }
}

export const checkFeatureCombo = (conditions) => {
    return async (req, res, next) => {
        try {
            const societyId = req.params.societyId || req.body.societyId || req.query.societyId;

            if (!societyId) {
                return next();
            }

            const plan = await getActivePlan(societyId);

            if (!plan) {
                return res.status(403).json({
                    success: false,
                    code: 'NO_PLAN',
                    message: 'No active plan found'
                });
            }

            const evaluateCondition = (condition) => {
                if (condition.and) {
                    return condition.and.every(c => evaluateCondition(c));
                }
                if (condition.or) {
                    return condition.or.some(c => evaluateCondition(c));
                }
                const feature = plan.featureMap?.[condition.feature];
                return feature?.included === true;
            };

            const isAllowed = evaluateCondition(conditions);

            if (!isAllowed) {
                return res.status(403).json({
                    success: false,
                    code: 'FEATURE_COMBO_NOT_ALLOWED',
                    message: 'Your plan does not include the required feature combination',
                    plan: plan.planName
                });
            }

            req.societyPlan = plan;
            next();
        } catch (error) {
            next(error);
        }
    };
};