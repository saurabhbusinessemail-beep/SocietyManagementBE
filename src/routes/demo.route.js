const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demo.controller');
import { userAuth } from '../middlewares/auth.middleware';


// Public routes
router.post('/', demoController.createBooking);
router.get('/slots', demoController.getAvailableSlots);
router.get('/reference/:reference', demoController.getBookingByReference);

// Protected routes (require authentication)
router.use(userAuth); // Apply authentication to all routes below

router.get('/', demoController.getAllBookings);
router.get('/dashboard/stats', demoController.getDashboardStats);
router.get('/range', demoController.getBookingsByDateRange);
router.get('/:id', demoController.getBookingById);

router.put('/:id', demoController.updateBooking);
router.post('/:id/reschedule', demoController.rescheduleDemo);
router.post('/:id/complete', demoController.completeDemo);
router.post('/:id/cancel', demoController.cancelDemo);
router.post('/:id/convert', demoController.markAsConverted);
router.post('/:id/notes', demoController.addFollowUpNote);
router.post('/:id/assign', demoController.assignTo);

// Delete operations
router.delete('/:id', demoController.deleteBooking);
router.post('/bulk-delete', demoController.bulkDeleteBookings);

// Export
router.get('/export', demoController.exportBookings);

// Statistics
router.get('/stats/status', demoController.getStatusStats);
router.get('/stats/source', demoController.getSourceStats);

// Date-based queries
router.get('/upcoming', demoController.getUpcomingDemos);
router.get('/today', demoController.getTodaysDemos);

// Reminders
router.post('/:id/remind', demoController.sendReminder);
router.post('/bulk-remind', demoController.bulkSendReminders);

// Timeline
router.get('/:id/timeline', demoController.getBookingTimeline);

// Slot availability
router.get('/check-slot', demoController.checkTimeSlotAvailability);
router.get('/availability-calendar', demoController.getAvailabilityCalendar);

// Status updates
router.post('/:id/confirm', demoController.confirmDemo);
router.post('/:id/no-show', demoController.markAsNoShow);

module.exports = router;