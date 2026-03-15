const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demo.controller');
const { body, param, query } = require('express-validator');
import { userAuth } from '../middlewares/auth.middleware';


// Validation rules
const bookingValidation = [
    body('fullName').notEmpty().withMessage('Full name is required').isLength({ min: 2 }),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).withMessage('Valid phone number is required'),
    body('preferredDate').isISO8601().withMessage('Valid date is required'),
    body('preferredTime').isIn(['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']).withMessage('Valid time slot is required'),
    body('societyName').optional().isLength({ max: 200 }),
    body('notes').optional().isLength({ max: 1000 })
];

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

router.put('/:id', bookingValidation, demoController.updateBooking);
router.post('/:id/reschedule', demoController.rescheduleDemo);
router.post('/:id/complete', demoController.completeDemo);
router.post('/:id/cancel', demoController.cancelDemo);
router.post('/:id/convert', demoController.markAsConverted);
router.post('/:id/notes', demoController.addFollowUpNote);
router.post('/:id/assign', demoController.assignTo);

module.exports = router;