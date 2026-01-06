import express from 'express';
import { userAuth } from '../middlewares/auth.middleware';
import * as complaintController from '../controllers/complaint.controller';
import { newRecordFields } from '../middlewares/newRecordFields';

const router = express.Router();
router.use(userAuth);

router.post('/', complaintController.getComplaints);

router.post('/add', newRecordFields, complaintController.createComplaint);

router.post('/:complaintId/changeStatus', complaintController.changeStatus);

router.delete('/:complaintId', complaintController.deleteComplaint);

export default router;
