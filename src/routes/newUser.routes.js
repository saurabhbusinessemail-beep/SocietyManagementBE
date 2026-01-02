import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import * as newUserController from '../controllers/newUser.controller';

const router = express.Router();
router.use(userAuth);

router.post('/newFlatMember', newRecordFields, newUserController.newFlatMember);

export default router;
