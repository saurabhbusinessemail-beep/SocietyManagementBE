import { SocietyPlan, PricingPlan } from '../models';

export const FixSocietyPlanFeatures = async () => {
    const results = { updated: 0, skipped: 0, error: null };

    try {
        const societyPlans = await SocietyPlan.find({});
        const pricingPlans = await PricingPlan.find({}).lean();
        
        const pricingPlanMap = {};
        pricingPlans.forEach(plan => {
            pricingPlanMap[plan.id] = plan;
        });

        let updates = [];

        for (const doc of societyPlans) {
            const planId = doc.planId;
            const pricingPlan = pricingPlanMap[planId];

            if (pricingPlan && pricingPlan.features) {
                const newFeatures = pricingPlan.features;

                // Map existing usage
                const existingFeaturesMap = {};
                if (doc.features && Array.isArray(doc.features)) {
                    doc.features.forEach(f => {
                        existingFeaturesMap[f.key] = {
                            currentUsage: f.currentUsage,
                            limit: f.limit
                        };
                    });
                }

                const updatedFeatures = newFeatures.map(f => {
                    const existing = existingFeaturesMap[f.key] || {};
                    return {
                        key: f.key,
                        name: f.name,
                        included: f.included,
                        currentUsage: existing.currentUsage || 0,
                        limit: f.value && !isNaN(parseInt(f.value)) ? parseInt(f.value) : 0,
                        hasLimit: f.value && !isNaN(parseInt(f.value))
                    };
                });

                updates.push({
                    updateOne: {
                        filter: { _id: doc._id },
                        update: { 
                            $set: { 
                                features: updatedFeatures,
                                featureCount: pricingPlan.featureCount
                            } 
                        }
                    }
                });
            } else {
                results.skipped++;
            }
        }

        if (updates.length > 0) {
            const bulkResult = await SocietyPlan.bulkWrite(updates);
            results.updated = bulkResult.modifiedCount;
        }

    } catch (err) {
        console.error('Error updating society plan features:', err);
        results.error = err.message;
    }

    return results;
}
