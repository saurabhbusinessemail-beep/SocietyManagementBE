const mongoose = require('mongoose');

const ApprovalRequestSchema = new mongoose.Schema({
    requestType: {
        type: String,
        enum: ['FlatMember', 'Security'],
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestedBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    societyId: {
        type: mongoose.Types.ObjectId,
        ref: 'Society',
        required: true
    },
    flatId: {
        type: mongoose.Types.ObjectId,
        ref: 'Flat'
        // Only required for FlatMember requests
    },
    
    requesterName: { type: String },
    requesterContact: { type: String },
    societyName: { type: String },
    flatNumber: { type: String },  // for FlatMember requests
    securityPersonName: { type: String },  // for Security requests
    securityPersonContact: { type: String },

    rejectionReason: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Admin dashboard: pending requests per society
ApprovalRequestSchema.index({ societyId: 1, status: 1 });
// Filter by type (FlatMember vs Security)
ApprovalRequestSchema.index({ societyId: 1, requestType: 1, status: 1 });
// User's own requests
ApprovalRequestSchema.index({ requestedBy: 1, status: 1 });
// Flat-scoped requests
ApprovalRequestSchema.index({ societyId: 1, flatId: 1 });

module.exports = mongoose.model('ApprovalRequest', ApprovalRequestSchema);