import { usageMetric } from '../services/misc.service';

export const getUsageMetric = async (req, res, next) => {
    try {
        const data = await usageMetric();
        res.json({
            data, success: true
        })
    } catch (err) {
        next(err);
    }
}