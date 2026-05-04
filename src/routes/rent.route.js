import express from 'express';
import * as rentController from '../controllers/rent.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { checkFeature } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

const router = express.Router();
router.use(userAuth);

// Record a new rent payment
router.post('/',
  newRecordFields,
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.recordPayment
);

// Get all rent payments with filters
router.get('/',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.getAllPayments
);

// Approve a payment
router.post('/:id/approve',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.approvePayment
);

// Reject a payment
router.post('/:id/reject',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.rejectPayment
);

// Get monthly report
router.post('/report/monthly',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.getMonthlyReport
);

// Get payments for a flat
router.get('/flat/:flatId',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.getPaymentsByFlat
);

// Get merged logs (payments + reminders) for a flat
router.get('/logs/flat/:flatId',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.getLogs
);

// Get pending approvals
router.get('/pending',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.getPendingApprovals
);

// Get rent summary
router.get('/summary',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.getRentSummary
);

// Update a payment (owner edit)
router.put('/:id',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.updatePayment
);

// Get a payment by ID
router.get('/:id',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.getPaymentById
);

// Delete a payment
router.delete('/:id',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.deletePayment
);

// Send reminder
router.post('/remind',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.sendReminder
);

// Send reminder to all
router.post('/remind-all',
  checkFeature(FEATURES.TENANT_MANAGEMENT),
  rentController.remindAll
);

export default router;
