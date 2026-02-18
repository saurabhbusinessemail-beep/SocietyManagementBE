import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import * as newUserController from '../controllers/newUser.controller';
import { decacheCurrentUser } from '../middlewares/decache.middleware';

const router = express.Router();
router.use(userAuth);

router.post('/newFlatMember', decacheCurrentUser, newRecordFields, newUserController.newFlatMember);

router.post('/newSecurity', decacheCurrentUser, newRecordFields, newUserController.newSecurity);

export default router;
