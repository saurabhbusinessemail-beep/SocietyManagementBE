import express from 'express';
const router = express.Router();

import userRoute from './user.route';
import authRoute from './auth.routes';
/**
 * Function contains Application routes
 *
 * @returns router
 */
const routes = () => {
  router.get('/', (req, res) => {
    res.json('Welcome');
  });
  router.use('/users', userRoute);
  router.use('/auth', authRoute);

  return router;
};

export default routes;
