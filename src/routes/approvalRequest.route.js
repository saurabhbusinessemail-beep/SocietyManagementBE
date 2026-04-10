import express from 'express';
import * as ApprovalController from '../controllers/approval.controller';
import { userAuth } from '../middlewares/auth.middleware';

const router = express.Router();
router.use(userAuth);

// router.get('/approval-requests', ApprovalController.getApprovalRequests);

router.get('/my-requests', ApprovalController.getMyRequests);
router.get('/to-approve', ApprovalController.getRequestsToApprove);
router.get('/all', ApprovalController.getAllMyRequests);

router.post('/:id/approve', ApprovalController.approveRequest);
router.post('/:id/reject', ApprovalController.rejectRequest);


export default router;