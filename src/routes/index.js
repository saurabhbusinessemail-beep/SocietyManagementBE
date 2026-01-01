import express from 'express';
const router = express.Router();

import userRoute from './user.route';
import authRoute from './auth.routes';
import societyRoutes from './society.route';
import flatRoutes from './flat.route';
import newUserRoutes from './newUser.routes';

const seedRoles = require("../seed/role.seeder");
const seedPermissions = require("../seed/permission.seeder");
const seedFeatures = require("../seed/feature.seeder");
const seedMenus = require("../seed/menus.seeder");
const seedRoleMenu = require("../seed/roleMenus.seeder");

/**
 * Function contains Application routes
 *
 * @returns router
 */
const routes = () => {
  router.get('/', async (req, res) => {
    
    await seedRoles();
    await seedPermissions();
    await seedFeatures();
    await seedMenus();
    await seedRoleMenu();

    res.json('Welcome');
  });
  router.use('/users', userRoute);
  router.use('/auth', authRoute);
  router.use('/societies', societyRoutes);
  router.use('/flats', flatRoutes);
  router.use('/newUser', newUserRoutes);

  return router;
};

export default routes;
