import { DemoBooking } from '../models';

// ==================== HELPER FUNCTIONS ====================

export const generateBookingReference = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DEMO-${year}${month}${day}-${random}`;
}

export const convertTimeTo24Hour = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');

    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;

    return `${hours.toString().padStart(2, '0')}:${minutes || '00'}`;
}

export const calculateScheduledDemoDate = (date, time) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    const timeStr = convertTimeTo24Hour(time);
    return new Date(`${dateStr}T${timeStr}:00`);
}

export const isValidTimeSlot = (time) => {
    const validSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
    return validSlots.includes(time);
}

// ==================== CREATE ====================

export const createBooking = async (bookingData, reqInfo = {}) => {
    try {
        // Validate required fields
        if (!bookingData.fullName || !bookingData.email || !bookingData.phone ||
            !bookingData.preferredDate || !bookingData.preferredTime) {
            return {
                success: false,
                message: 'Missing required fields'
            };
        }

        // Validate time slot
        if (!isValidTimeSlot(bookingData.preferredTime)) {
            return {
                success: false,
                message: 'Invalid time slot selected'
            };
        }

        // Check availability
        const slots = await getAvailableSlots(bookingData.preferredDate, 3);
        const selectedSlot = slots.data.slots.find(s => s.time === bookingData.preferredTime);

        if (!selectedSlot || !selectedSlot.available) {
            return {
                success: false,
                message: 'Selected time slot is not available'
            };
        }

        // Prepare booking data
        const newBooking = new DemoBooking({
            fullName: bookingData.fullName,
            email: bookingData.email.toLowerCase(),
            phone: bookingData.phone,
            societyName: bookingData.societyName || '',
            preferredDate: new Date(bookingData.preferredDate),
            preferredTime: bookingData.preferredTime,
            notes: bookingData.notes || '',
            source: bookingData.source || 'website',
            ipAddress: reqInfo.ipAddress,
            userAgent: reqInfo.userAgent,
            bookingReference: generateBookingReference(),
            scheduledDemoDate: calculateScheduledDemoDate(
                bookingData.preferredDate,
                bookingData.preferredTime
            ),
            status: 'pending',
            rescheduleCount: 0,
            previousTimeSlots: [],
            convertedToCustomer: false,
            followUpNotes: []
        });

        // Save to database
        const savedBooking = await newBooking.save();

        return {
            success: true,
            message: 'Demo booked successfully',
            data: savedBooking
        };
    } catch (error) {
        console.error('Create booking error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return {
                success: false,
                message: 'Booking with this reference already exists'
            };
        }

        return {
            success: false,
            message: error.message || 'Failed to create booking'
        };
    }
}

// ==================== READ ====================

export const getBookingById = async (bookingId) => {
    try {
        const booking = await DemoBooking.findById(bookingId)
            .populate('assignedTo', 'fullName email');

        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        return {
            success: true,
            data: booking
        };
    } catch (error) {
        console.error('Get booking error:', error);
        return {
            success: false,
            message: error.message || 'Failed to fetch booking'
        };
    }
}

export const getBookingByReference = async (reference) => {
    try {
        const booking = await DemoBooking.findOne({ bookingReference: reference })
            .populate('assignedTo', 'fullName email');

        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        return {
            success: true,
            data: booking
        };
    } catch (error) {
        console.error('Get booking by reference error:', error);
        return {
            success: false,
            message: error.message || 'Failed to fetch booking'
        };
    }
}

export const getAllBookings = async (filters = {}, pagination = {}) => {
    try {
        const {
            status,
            source,
            startDate,
            endDate,
            search
        } = filters;

        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = pagination;

        // Build query
        const query = {};

        if (status) query.status = status;
        if (source) query.source = source;

        if (startDate || endDate) {
            query.preferredDate = {};
            if (startDate) query.preferredDate.$gte = new Date(startDate);
            if (endDate) query.preferredDate.$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { societyName: { $regex: search, $options: 'i' } },
                { bookingReference: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Execute queries
        const [bookings, total] = await Promise.all([
            DemoBooking.find(query)
                .populate('assignedTo', 'fullName email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            DemoBooking.countDocuments(query)
        ]);

        return {
            success: true,
            data: bookings,
            limit,
            page,
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Get all bookings error:', error);
        return {
            success: false,
            message: error.message || 'Failed to fetch bookings'
        };
    }
}

export const getAvailableSlots = async (date, maxPerSlot = 3) => {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Find all bookings for this date
        const bookings = await DemoBooking.find({
            preferredDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'confirmed', 'rescheduled'] }
        }).select('preferredTime').lean();

        // Count bookings per time slot
        const slotCounts = {};
        bookings.forEach(booking => {
            slotCounts[booking.preferredTime] = (slotCounts[booking.preferredTime] || 0) + 1;
        });

        const allSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

        const slots = allSlots.map(time => ({
            time,
            available: (slotCounts[time] || 0) < maxPerSlot,
            bookedCount: slotCounts[time] || 0,
            maxCapacity: maxPerSlot
        }));

        return {
            success: true,
            data: {
                date,
                slots
            }
        };
    } catch (error) {
        console.error('Get available slots error:', error);
        return {
            success: false,
            message: error.message || 'Failed to get available slots'
        };
    }
}

export const getBookingsByDateRange = async (startDate, endDate, status = null) => {
    try {
        const query = {
            preferredDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (status) query.status = status;

        const bookings = await DemoBooking.find(query)
            // .populate('assignedTo', 'fullName email')
            .sort({ preferredDate: 1 });

        return {
            success: true,
            data: bookings
        };
    } catch (error) {
        console.error('Get bookings by date range error:', error);
        return {
            success: false,
            message: error.message || 'Failed to fetch bookings'
        };
    }
}

export const getDashboardStats = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Get counts
        const totalBookings = await DemoBooking.countDocuments();
        const todayBookings = await DemoBooking.countDocuments({
            preferredDate: { $gte: today, $lt: tomorrow }
        });
        const pendingBookings = await DemoBooking.countDocuments({ status: 'pending' });
        const confirmedBookings = await DemoBooking.countDocuments({ status: 'confirmed' });
        const completedBookings = await DemoBooking.countDocuments({ status: 'completed' });
        const cancelledBookings = await DemoBooking.countDocuments({ status: 'cancelled' });
        const rescheduledBookings = await DemoBooking.countDocuments({ status: 'rescheduled' });
        const noShowBookings = await DemoBooking.countDocuments({ status: 'no_show' });
        const followUpBookings = await DemoBooking.countDocuments({ status: 'follow_up' });
        const convertedCount = await DemoBooking.countDocuments({ convertedToCustomer: true });

        // Get bookings by source
        const sourceStats = await DemoBooking.aggregate([
            {
                $group: {
                    _id: '$source',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get monthly stats
        const monthlyStats = await DemoBooking.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    converted: {
                        $sum: { $cond: [{ $eq: ['$convertedToCustomer', true] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const conversionRate = totalBookings > 0 ? (convertedCount / totalBookings) * 100 : 0;

        return {
            success: true,
            data: {
                overview: {
                    totalBookings,
                    todayBookings,
                    pendingBookings,
                    confirmedBookings,
                    completedBookings,
                    cancelledBookings,
                    rescheduledBookings,
                    noShowBookings,
                    followUpBookings,
                    convertedCount,
                    conversionRate: parseFloat(conversionRate.toFixed(2))
                },
                bySource: sourceStats.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                monthlyStats
            }
        };
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return {
            success: false,
            message: error.message || 'Failed to get dashboard stats'
        };
    }
}

// ==================== UPDATE ====================

export const updateBooking = async (bookingId, updateData) => {
    try {
        // Remove fields that shouldn't be updated directly
        const allowedUpdates = {
            fullName: updateData.fullName,
            email: updateData.email,
            phone: updateData.phone,
            societyName: updateData.societyName,
            notes: updateData.notes,
            status: updateData.status,
            feedback: updateData.feedback,
            rating: updateData.rating,
            assignedTo: updateData.assignedTo,
            followUpDate: updateData.followUpDate,
            convertedToCustomer: updateData.convertedToCustomer,
            convertedToCustomerDate: updateData.convertedToCustomerDate
        };

        // Remove undefined fields
        Object.keys(allowedUpdates).forEach(key =>
            allowedUpdates[key] === undefined && delete allowedUpdates[key]
        );

        const booking = await DemoBooking.findByIdAndUpdate(
            bookingId,
            { ...allowedUpdates, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'fullName email');

        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        return {
            success: true,
            message: 'Booking updated successfully',
            data: booking
        };
    } catch (error) {
        console.error('Update booking error:', error);
        return {
            success: false,
            message: error.message || 'Failed to update booking'
        };
    }
}

export const rescheduleDemo = async (bookingId, newDate, newTime, reason, rescheduledBy = 'customer') => {
    try {
        // Get booking
        const booking = await DemoBooking.findById(bookingId);
        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        // Validate new time slot
        if (!isValidTimeSlot(newTime)) {
            return {
                success: false,
                message: 'Invalid time slot'
            };
        }

        // Check availability
        const slots = await getAvailableSlots(newDate, 3);
        const selectedSlot = slots.data.slots.find(s => s.time === newTime);

        if (!selectedSlot || !selectedSlot.available) {
            return {
                success: false,
                message: 'Selected time slot is not available'
            };
        }

        // Save current slot to history
        const previousSlot = {
            date: booking.preferredDate,
            time: booking.preferredTime,
            rescheduledAt: new Date(),
            rescheduledBy,
            reason
        };

        const previousTimeSlots = booking.previousTimeSlots || [];
        previousTimeSlots.push(previousSlot);

        // Update booking
        booking.preferredDate = new Date(newDate);
        booking.preferredTime = newTime;
        booking.scheduledDemoDate = calculateScheduledDemoDate(newDate, newTime);
        booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;
        booking.status = 'rescheduled';
        booking.previousTimeSlots = previousTimeSlots;
        booking.updatedAt = new Date();

        const updatedBooking = await booking.save();

        return {
            success: true,
            message: 'Demo rescheduled successfully',
            data: updatedBooking
        };
    } catch (error) {
        console.error('Reschedule error:', error);
        return {
            success: false,
            message: error.message || 'Failed to reschedule demo'
        };
    }
}

export const completeDemo = async (bookingId, feedback, rating) => {
    try {
        const booking = await DemoBooking.findById(bookingId);
        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        booking.status = 'completed';
        booking.demoCompletedDate = new Date();
        if (feedback) booking.feedback = feedback;
        if (rating) booking.rating = rating;
        booking.updatedAt = new Date();

        const updatedBooking = await booking.save();

        return {
            success: true,
            message: 'Demo completed successfully',
            data: updatedBooking
        };
    } catch (error) {
        console.error('Complete demo error:', error);
        return {
            success: false,
            message: error.message || 'Failed to complete demo'
        };
    }
}

export const cancelDemo = async (bookingId, reason) => {
    try {
        const booking = await DemoBooking.findById(bookingId);
        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        const followUpNotes = booking.followUpNotes || [];
        if (reason) {
            followUpNotes.push(`Cancelled: ${reason} (${new Date().toLocaleString()})`);
        }

        booking.status = 'cancelled';
        booking.followUpNotes = followUpNotes;
        booking.updatedAt = new Date();

        const updatedBooking = await booking.save();

        return {
            success: true,
            message: 'Demo cancelled successfully',
            data: updatedBooking
        };
    } catch (error) {
        console.error('Cancel demo error:', error);
        return {
            success: false,
            message: error.message || 'Failed to cancel demo'
        };
    }
}

export const markAsConverted = async (bookingId) => {
    try {
        const booking = await DemoBooking.findById(bookingId);
        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        booking.convertedToCustomer = true;
        booking.convertedToCustomerDate = new Date();
        booking.updatedAt = new Date();

        const updatedBooking = await booking.save();

        return {
            success: true,
            message: 'Marked as converted successfully',
            data: updatedBooking
        };
    } catch (error) {
        console.error('Mark converted error:', error);
        return {
            success: false,
            message: error.message || 'Failed to mark as converted'
        };
    }
}

export const addFollowUpNote = async (bookingId, note) => {
    try {
        const booking = await DemoBooking.findById(bookingId);
        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        const followUpNotes = booking.followUpNotes || [];
        followUpNotes.push(`${note} (${new Date().toLocaleString()})`);

        booking.followUpNotes = followUpNotes;
        booking.updatedAt = new Date();

        const updatedBooking = await booking.save();

        return {
            success: true,
            message: 'Follow-up note added successfully',
            data: updatedBooking
        };
    } catch (error) {
        console.error('Add note error:', error);
        return {
            success: false,
            message: error.message || 'Failed to add note'
        };
    }
}

export const assignTo = async (bookingId, userId) => {
    try {
        const booking = await DemoBooking.findById(bookingId);
        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        // Set follow-up date to 7 days from now
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 7);

        booking.assignedTo = userId;
        booking.followUpDate = followUpDate;
        booking.updatedAt = new Date();

        const updatedBooking = await booking.save();

        return {
            success: true,
            message: 'Assigned successfully',
            data: updatedBooking
        };
    } catch (error) {
        console.error('Assign error:', error);
        return {
            success: false,
            message: error.message || 'Failed to assign'
        };
    }
}

// ==================== DELETE ====================

export const deleteBooking = async (bookingId) => {
    try {
        const booking = await DemoBooking.findByIdAndDelete(bookingId);

        if (!booking) {
            return {
                success: false,
                message: 'Booking not found'
            };
        }

        return {
            success: true,
            message: 'Booking deleted successfully'
        };
    } catch (error) {
        console.error('Delete booking error:', error);
        return {
            success: false,
            message: error.message || 'Failed to delete booking'
        };
    }
}

export const bulkDeleteBookings = async (bookingIds) => {
    try {
        const result = await DemoBooking.deleteMany({ _id: { $in: bookingIds } });

        return {
            success: true,
            message: `${result.deletedCount} bookings deleted successfully`,
            data: { deletedCount: result.deletedCount }
        };
    } catch (error) {
        console.error('Bulk delete error:', error);
        return {
            success: false,
            message: error.message || 'Failed to delete bookings'
        };
    }
}

export const exportBookings = async (filters) => {
    const query = buildFilters(filters);
    const bookings = await DemoBooking.find(query).lean();
    
    // Convert to CSV
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Society', 'Date', 'Time', 'Status', 'Source'];
    const csvRows = [headers.join(',')];
    
    bookings.forEach(b => {
        const row = [
            b._id,
            `"${b.fullName}"`,
            `"${b.email}"`,
            `"${b.phone}"`,
            `"${b.societyName || ''}"`,
            b.preferredDate,
            `"${b.preferredTime}"`,
            b.status,
            b.source
        ].join(',');
        csvRows.push(row);
    });
    
    return csvRows.join('\n');
};

// Statistics
export const getStatusStats = async () => {
    return await DemoBooking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
};

export const getSourceStats = async () => {
    return await DemoBooking.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
};

// Date-based queries
export const getUpcomingDemos = async (days) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await DemoBooking.find({
        preferredDate: { $gte: new Date(), $lte: futureDate },
        status: { $in: ['confirmed', 'rescheduled'] }
    }).sort({ preferredDate: 1 });
};

export const getTodaysDemos = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await DemoBooking.find({
        preferredDate: { $gte: today, $lt: tomorrow }
    }).sort({ preferredTime: 1 });
};

// Reminders
export const sendReminder = async (id) => {
    const booking = await DemoBooking.findById(id);
    if (!booking) throw new Error('Booking not found');
    
    // Implement email/sms sending logic here
    console.log(`Reminder sent for booking ${id}`);
    
    return { message: 'Reminder sent successfully', id };
};

export const bulkSendReminders = async (ids) => {
    const bookings = await DemoBooking.find({ _id: { $in: ids } });
    
    // Implement bulk reminder logic here
    console.log(`Reminders sent for ${bookings.length} bookings`);
    
    return { count: bookings.length };
};

// Timeline
export const getBookingTimeline = async (id) => {
    const booking = await DemoBooking.findById(id);
    if (!booking) throw new Error('Booking not found');
    
    const timeline = [
        { action: 'created', timestamp: booking.createdAt, data: booking }
    ];
    
    if (booking.rescheduleCount > 0) {
        timeline.push({ 
            action: 'rescheduled', 
            timestamp: booking.updatedAt,
            count: booking.rescheduleCount 
        });
    }
    
    if (booking.status === 'completed') {
        timeline.push({ 
            action: 'completed', 
            timestamp: booking.demoCompletedDate || booking.updatedAt 
        });
    }
    
    return timeline;
};

// Slot availability
export const checkTimeSlotAvailability = async (date, time) => {
    const bookingsOnDate = await DemoBooking.countDocuments({
        preferredDate: new Date(date),
        preferredTime: time,
        status: { $nin: ['cancelled', 'no_show'] }
    });
    
    const maxPerSlot = 5; // Configure as needed
    return { available: bookingsOnDate < maxPerSlot };
};

export const getAvailabilityCalendar = async (startDate, endDate) => {
    const bookings = await DemoBooking.find({
        preferredDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: { $nin: ['cancelled', 'no_show'] }
    });
    
    // Group by date and time slot
    const calendar = {};
    bookings.forEach(b => {
        const dateKey = b.preferredDate.toISOString().split('T')[0];
        if (!calendar[dateKey]) calendar[dateKey] = {};
        
        calendar[dateKey][b.preferredTime] = (calendar[dateKey][b.preferredTime] || 0) + 1;
    });
    
    return calendar;
};

// Status updates
export const confirmDemo = async (id) => {
    return await DemoBooking.findByIdAndUpdate(
        id,
        { 
            status: 'confirmed',
            updatedAt: new Date()
        },
        { new: true }
    );
};

export const markAsNoShow = async (id) => {
    return await DemoBooking.findByIdAndUpdate(
        id,
        { 
            status: 'no_show',
            updatedAt: new Date()
        },
        { new: true }
    );
};