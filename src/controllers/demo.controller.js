const demoBookingService = require('../services/demo.service');
const { validationResult } = require('express-validator');
import { DemoBooking } from '../models';

class DemoBookingController {

    // Create new booking
    async createBooking(req, res) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('errors = ', errors)
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    data: errors.array()
                });
            }

            const reqInfo = {
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            };

            const result = await demoBookingService.createBooking(req.body, reqInfo);

            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create booking'
            });
        }
    }

    // Get booking by ID
    async getBookingById(req, res) {
        try {
            const result = await demoBookingService.getBookingById(req.params.id);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch booking'
            });
        }
    }

    // Get booking by reference
    async getBookingByReference(req, res) {
        try {
            const result = await demoBookingService.getBookingByReference(req.params.reference);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch booking'
            });
        }
    }

    // Get all bookings with pagination
    async getAllBookings(req, res) {
        try {
            const filters = {
                status: req.query.status,
                source: req.query.source,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                search: req.query.search
            };

            const pagination = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };

            const result = await demoBookingService.getAllBookings(filters, pagination);

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch bookings'
            });
        }
    }

    // Update booking
    async updateBooking(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    data: errors.array()
                });
            }

            const result = await demoBookingService.updateBooking(req.params.id, req.body);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update booking'
            });
        }
    }

    // Reschedule demo
    async rescheduleDemo(req, res) {
        try {
            const { newDate, newTime, reason, rescheduledBy } = req.body;

            if (!newDate || !newTime) {
                return res.status(400).json({
                    success: false,
                    message: 'New date and time are required'
                });
            }

            const result = await demoBookingService.rescheduleDemo(
                req.params.id,
                newDate,
                newTime,
                reason,
                rescheduledBy
            );

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to reschedule demo'
            });
        }
    }

    // Complete demo
    async completeDemo(req, res) {
        try {
            const { feedback, rating } = req.body;

            const result = await demoBookingService.completeDemo(req.params.id, feedback, rating);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to complete demo'
            });
        }
    }

    // Cancel demo
    async cancelDemo(req, res) {
        try {
            const { reason } = req.body;

            const result = await demoBookingService.cancelDemo(req.params.id, reason);

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to cancel demo'
            });
        }
    }

    // Get available time slots
    async getAvailableSlots(req, res) {
        try {
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: 'Date is required'
                });
            }

            const maxPerSlot = parseInt(req.query.maxPerSlot) || 3;
            const result = await demoBookingService.getAvailableSlots(date, maxPerSlot);

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch available slots'
            });
        }
    }

    // Get bookings by date range
    async getBookingsByDateRange(req, res) {
        try {
            const { startDate, endDate, status } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            const result = await demoBookingService.getBookingsByDateRange(startDate, endDate, status);

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch bookings'
            });
        }
    }

    // Get dashboard stats
    async getDashboardStats(req, res) {
        try {
            const result = await demoBookingService.getDashboardStats();

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch dashboard stats'
            });
        }
    }

    // Mark as converted to customer
    async markAsConverted(req, res) {
        try {
            const result = await demoBookingService.updateBooking(req.params.id, {
                convertedToCustomer: true,
                convertedToCustomerDate: new Date()
            });

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to mark as converted'
            });
        }
    }

    // Add follow-up note
    async addFollowUpNote(req, res) {
        try {
            const { note } = req.body;

            if (!note) {
                return res.status(400).json({
                    success: false,
                    message: 'Note is required'
                });
            }

            const booking = await DemoBooking.findById(req.params.id);

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            booking.followUpNotes.push(note);
            await booking.save();

            res.status(200).json({
                success: true,
                message: 'Follow-up note added successfully',
                data: booking
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add follow-up note'
            });
        }
    }

    // Assign to team member
    async assignTo(req, res) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const result = await demoBookingService.updateBooking(req.params.id, {
                assignedTo: userId,
                followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            });

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to assign booking'
            });
        }
    }
}

module.exports = new DemoBookingController();