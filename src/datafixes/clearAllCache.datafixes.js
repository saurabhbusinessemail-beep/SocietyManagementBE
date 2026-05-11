import cacheService from '../services/cache.service';
import { invalidatePlanCache } from '../services/planCache.service';
import { SocietyPlan } from '../models';

export const ClearAllCache = async () => {
    const results = { userCacheCleared: 0, planCacheCleared: 0, error: null };

    try {
        // Clear user auth cache
        const stats = cacheService.getStats();
        results.userCacheCleared = stats.size;
        cacheService.clear();

        // Clear plan cache for all societies with active plans
        const activePlans = await SocietyPlan.find({ isActive: true }).select('societyId').lean();
        activePlans.forEach(plan => {
            invalidatePlanCache(plan.societyId.toString());
        });
        results.planCacheCleared = activePlans.length;

    } catch (err) {
        console.error('Error clearing cache:', err);
        results.error = err.message;
    }

    return results;
}
