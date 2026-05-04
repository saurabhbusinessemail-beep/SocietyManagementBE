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
  checkFeature(FEATURES.RENT),
  rentController.recordPayment
);

// Get all rent payments with filters
router.get('/',
  checkFeature(FEATURES.RENT),
  rentController.getAllPayments
);

// Approve a payment
router.post('/:id/approve',
  checkFeature(FEATURES.RENT),
  rentController.approvePayment
);

// Reject a payment
router.post('/:id/reject',
  checkFeature(FEATURES.RENT),
  rentController.rejectPayment
);

// Get monthly report
router.post('/report/monthly',
  checkFeature(FEATURES.RENT),
  rentController.getMonthlyReport
);

// Get payments for a flat
router.get('/flat/:flatId',
  checkFeature(FEATURES.RENT),
  rentController.getPaymentsByFlat
);

// Get merged logs (payments + reminders) for a flat
router.get('/logs/flat/:flatId',
  checkFeature(FEATURES.RENT),
  rentController.getLogs
);

// Get pending approvals
router.get('/pending',
  checkFeature(FEATURES.RENT),
  rentController.getPendingApprovals
);

// Get rent summary
router.get('/summary',
  checkFeature(FEATURES.RENT),
  rentController.getRentSummary
);

// Update a payment (owner edit)
router.put('/:id',
  checkFeature(FEATURES.RENT),
  rentController.updatePayment
);

// Get a payment by ID
router.get('/:id',
  checkFeature(FEATURES.RENT),
  rentController.getPaymentById
);

// Delete a payment
router.delete('/:id',
  checkFeature(FEATURES.RENT),
  rentController.deletePayment
);

// Send reminder
router.post('/remind',
  checkFeature(FEATURES.RENT),
  rentController.sendReminder
);

// Send reminder to all
router.post('/remind-all',
  checkFeature(FEATURES.RENT),
  rentController.remindAll
);

export default router;
