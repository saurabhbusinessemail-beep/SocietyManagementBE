import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import { isFlatMember } from '../middlewares/flat.middleware';
import * as flatController from '../controllers/flat.controller';

const router = express.Router();
router.use(userAuth);

router.get('/myFlats', flatController.myFlats);

router.get('/get/:flatId', flatController.getFlatById);

router.get('/:id/myFlats', flatController.myFlats);

router.get('/myFlats/:flatMemberId', isFlatMember, flatController.flatMember);

router.post('/myTenants', flatController.myTenants);

router.post('/myFlatMembers', flatController.myFlatMembers);

router.patch('/updatedeleteFlatMemberLeaseEnd/:flatMemberId', flatController.updatedeleteFlatMemberLeaseEnd);

router.delete('/deleteFlatMember/:flatMemberId', flatController.deleteFlatMember);

export default router;
