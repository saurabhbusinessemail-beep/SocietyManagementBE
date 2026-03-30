import express from 'express';
import { getUsageMetric } from '../controllers/misc.controller';

const router = express.Router();


router.get('/getUsageMetric', getUsageMetric);

export default router;