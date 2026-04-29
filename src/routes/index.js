import express from 'express';
const router = express.Router();

import userRoute from './user.route';
import authRoute from './auth.routes';
import pricingPlanRoutes from './pricingPlans.route';
import societyRoutes from './society.route';
import flatRoutes from './flat.route';
import complaintRoutes from './complaint.route';
import couponRoutes from './coupon.routes';
import demoRoutes from './demo.route';
import miscRoutes from './misc.route';
import newUserRoutes from './newUser.routes';
import paymentRoutes from './payment.routes';
import gatepassRoutes from './gatepass.route';
import gateentryRoutes from './gateentry.route';
import announcement from './announcement.route';
import comments from './comment.route';
import vehicle from './vehicle.route';
import approval from './approvalRequest.route'
import maintenance from './maintenance.route'

const seedRoles = require('../seed/role.seeder');
const seedPermissions = require('../seed/permission.seeder');
const seedMenus = require('../seed/menus.seeder');
const seedFeatures = require('../seed/feature.seeder');
const seedRoleMenu = require('../seed/roleMenus.seeder');
const seedPricingPlan = require('../seed/pricingPlans.seeder');
import { updateSocietyRecords } from '../seed/updateSociety';
import { getOrCreateDefaultUser } from '../seed/emptyUser.seeder';
import { NormaliseAllPhoneNumbers } from '../datafixes/fixPhoneNumbers.datafixes';

/**
 * Function contains Application routes
 *
 * @returns router
 */
const routes = () => {
  router.get('/', async (req, res) => {
    res.json('Welcome');
  });
  router.get('/seed', async (req, res) => {
    await seedRoles();
    await seedPermissions();
    await seedMenus();
    await seedFeatures();
    await seedRoleMenu();
    await updateSocietyRecords();
    await getOrCreateDefaultUser();
    await seedPricingPlan();

    res.send('Seed Completed');
  });
  router.get('/fixPhoneNumbers', async (req, res) => {

    const data = await NormaliseAllPhoneNumbers();
    res.json(data);
  });
  router.use('/users', userRoute);
  router.use('/auth', authRoute);
  router.use('/pricing-plan', pricingPlanRoutes);
  router.use('/societies', societyRoutes);
  router.use('/flats', flatRoutes);
  router.use('/complaint', complaintRoutes);
  router.use('/coupons', couponRoutes);
  router.use('/demo', demoRoutes);
  router.use('/misc', miscRoutes);
  router.use('/newUser', newUserRoutes);
  router.use('/gatepass', gatepassRoutes);
  router.use('/gateentry', gateentryRoutes);
  router.use('/announcement', announcement);
  router.use('/comments', comments);
  router.use('/vehicle', vehicle);
  router.use('/payments', paymentRoutes);
  router.use('/approvals', approval);
  router.use('/maintenance', maintenance);


  return router;
};

export default routes;
