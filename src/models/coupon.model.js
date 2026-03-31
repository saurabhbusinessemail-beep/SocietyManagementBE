const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['percentage', 'fixed', 'direct'],
        },
        value: {
            type: Number,
            required: true,
        },
        planId: {
            type: String,
            default: null,   // null means applies to all plans
            index: true,     // for filtering by plan
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for active coupons lookups (optional but useful)
couponSchema.index({ isActive: 1, code: 1 });
// Optional: index for filtering by plan + active
couponSchema.index({ planId: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);