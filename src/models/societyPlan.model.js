const mongoose = require("mongoose");

// Simple feature tracking for purchased plan
const PurchasedFeatureSchema = new mongoose.Schema({
    key: { type: String, required: true },  // reference to feature key
    name: { type: String, required: true },        // feature display name
    included: { type: Boolean, default: false },
    currentUsage: { type: Number, default: 0 },
    limit: { type: Number, default: 0 },           // 0 = unlimited
    hasLimit: { type: Boolean, default: false }
}, { _id: false });

const SocietyPlanSchema = new mongoose.Schema({
    // Society reference
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
    flatsCount: { type: Number, required: true },

    // Plan reference
    planId: { type: String, ref: 'PricingPlan', required: true },
    planName: { type: String, required: true },    // snapshot of plan name at purchase

    // Plan details snapshot
    price: { type: String, required: true },        // price at purchase time
    period: { type: String },                        // billing period
    featureCount: { type: String },                  // e.g., "4/14"

    // Features with their current usage
    features: [PurchasedFeatureSchema],

    // Subscription details
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    autoRenew: { type: Boolean, default: false },

    // Billing
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'yearly' },
    totalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpayOrderId: { type: String },
    razorPayTransaction: { type: String },

    // Metadata
    purchasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },

    // Duration
    selectedDuration: {
        value: { type: Number },
        unit: { type: String, enum: ['months', 'years'] }
    }

}, { timestamps: true });

// Indexes for faster lookups
SocietyPlanSchema.index({ societyId: 1, isActive: 1 });
SocietyPlanSchema.index({ planId: 1 });
// paymentStatus enum — used in billing queries
SocietyPlanSchema.index({ societyId: 1, paymentStatus: 1 });
// purchasedBy ref
SocietyPlanSchema.index({ purchasedBy: 1 });

module.exports = mongoose.model("SocietyPlan", SocietyPlanSchema);