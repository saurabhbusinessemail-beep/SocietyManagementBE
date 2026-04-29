import express from 'express';
import * as maintenanceController from '../controllers/maintenance.controller';
import { userAuth } from '../middlewares/auth.middleware';
import { newRecordFields } from '../middlewares/newRecordFields';
import { checkFeature } from '../middlewares/featureGuard.middleware';
import { FEATURES } from '../config/features';

const router = express.Router();
router.use(userAuth);

// Record a new maintenance payment
router.post('/',
  newRecordFields,
  checkFeature(FEATURES.MAINTENANCE),
  maintenanceController.recordPayment
);

// Get all maintenance payments with filters
router.get('/',
  checkFeature(FEATURES.MAINTENANCE),
  maintenanceController.getAllPayments
);

// Get monthly report
router.post('/report/monthly',
  checkFeature(FEATURES.MAINTENANCE),
  maintenanceController.getMonthlyReport
);

// Get yearly report
router.post('/report/yearly',
  checkFeature(FEATURES.MAINTENANCE),
  maintenanceController.getYearlyReport
);

// Approve a payment
router.post('/:id/approve',
  maintenanceController.approvePayment
);

// Reject a payment
router.post('/:id/reject',
  maintenanceController.rejectPayment
);

// Get payments for a flat
router.get('/flat/:flatId',
  maintenanceController.getPaymentsByFlat
);

// Get merged logs (payments + reminders) for a flat
router.get('/logs/flat/:flatId',
  maintenanceController.getLogs
);

// Get pending approvals
router.get('/pending',
  maintenanceController.getPendingApprovals
);

// Get maintenance summary
router.get('/summary',
  maintenanceController.getMaintenanceSummary
);

// Update a payment (admin edit)
router.put('/:id',
  maintenanceController.updatePayment
);

// Get a payment by ID
router.get('/:id',
  maintenanceController.getPaymentById
);

// Delete a payment
router.delete('/:id',
  maintenanceController.deletePayment
);

// Send reminder
router.post('/remind',
  checkFeature(FEATURES.MAINTENANCE),
  maintenanceController.sendReminder
);

// Send reminder to all
router.post('/remind-all',
  checkFeature(FEATURES.MAINTENANCE),
  maintenanceController.remindAll
);

export default router;
