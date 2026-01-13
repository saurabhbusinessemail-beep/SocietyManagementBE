import express from 'express';
const router = express.Router();

import userRoute from './user.route';
import authRoute from './auth.routes';
import societyRoutes from './society.route';
import flatRoutes from './flat.route';
import complaintRoutes from './complaint.route';
import newUserRoutes from './newUser.routes';
import gatepassRoutes from './gatepass.route';
import gateentryRoutes from './gateentry.route';

const seedRoles = require("../seed/role.seeder");
const seedPermissions = require("../seed/permission.seeder");
const seedMenus = require("../seed/menus.seeder");
const seedFeatures = require("../seed/feature.seeder");
const seedRoleMenu = require("../seed/roleMenus.seeder");

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

    res.send('Seed Completed');
  });
  router.use('/users', userRoute);
  router.use('/auth', authRoute);
  router.use('/societies', societyRoutes);
  router.use('/flats', flatRoutes);
  router.use('/complaint', complaintRoutes);
  router.use('/newUser', newUserRoutes);
  router.use('/gatepass', gatepassRoutes);
  router.use('/gateentry', gateentryRoutes);

  return router;
};

export default routes;
