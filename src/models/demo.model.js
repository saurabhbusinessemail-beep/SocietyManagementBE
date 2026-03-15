const mongoose = require('mongoose');

// Previous Time Slot Schema
const previousTimeSlotSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    time: { type: String, required: true },
    rescheduledAt: { type: Date, default: Date.now },
    rescheduledBy: { type: String, enum: ['customer', 'admin', 'system'], default: 'customer' },
    reason: { type: String, trim: true }
});

// Main Schema - ONLY FIELD DEFINITIONS, absolutely NO methods
const demoSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    societyName: { type: String, trim: true },
    preferredDate: { type: Date, required: true },
    preferredTime: {
        type: String,
        required: true,
        enum: ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']
    },
    notes: { type: String, trim: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show', 'follow_up'],
        default: 'pending'
    },
    bookingReference: { type: String, unique: true, sparse: true },
    scheduledDemoDate: Date,
    demoCompletedDate: Date,
    rescheduleCount: { type: Number, default: 0 },
    previousTimeSlots: [previousTimeSlotSchema],
    feedback: String,
    rating: Number,
    source: { type: String, default: 'website' },
    ipAddress: String,
    userAgent: String,
    convertedToCustomer: { type: Boolean, default: false },
    convertedToCustomerDate: Date,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    followUpDate: Date,
    followUpNotes: [String]
}, { timestamps: true });

// Create and export model directly
module.exports = mongoose.model('DemoBooking', demoSchema);