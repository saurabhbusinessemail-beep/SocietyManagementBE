const mongoose = require("mongoose");

const PricingFeatureSchema = new mongoose.Schema({
    key: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: String },
    included: { type: Boolean, default: false }
}, { _id: false });

const ColorsSchema = new mongoose.Schema({
    primary: { type: String, default: '#475569' },
    light: { type: String, default: '#e2e8f0' },
    lighter: { type: String, default: '#f1f5f9' },
    border: { type: String, default: '#e2e8f0' },
    text: { type: String, default: '#334155' },
    button: { type: String },
    buttonFrom: { type: String },
    buttonTo: { type: String },
    buttonHover: { type: String },
    badgeBg: { type: String },
    gradientFrom: { type: String, default: '#f1f5f9' },
    gradientTo: { type: String, default: '#f8fafc' }
}, { _id: false });

const PricingPlanSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, default: 'building2' },
    price: { type: String, required: true },
    priceSuffix: { type: String },
    priceNote: { type: String },
    period: { type: String },
    badge: { type: String },
    colors: { type: ColorsSchema, required: true },
    features: [PricingFeatureSchema],
    featureCount: { type: String, default: "0/0" },
    buttonText: { type: String, default: 'Get Started' },
    buttonVariant: { type: String, enum: ['popular', 'best-value', 'default'], default: 'default' },
    isPopular: { type: Boolean, default: false },
    isBestValue: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("PricingPlan", PricingPlanSchema);