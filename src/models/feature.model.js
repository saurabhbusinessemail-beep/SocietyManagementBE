const mongoose = require("mongoose");

const RuleSchema = new mongoose.Schema({
  type: { type: String, enum: ["count"], default: "count" },
  count: { type: Number, default: 0 },     // used when type = count
  rulePrice: { type: Number, default: 0 }, // price per rule/count
  calculated: { type: Number, default: 0 } // rulePrice * count
}, { _id: false });

const FeatureSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },     // machine readable key
  name: { type: String, required: true },                  // display name
  description: { type: String },

  // Pricing
  basePrice: { type: Number, default: 0 },                 // direct base price
  rulesPriceTotal: { type: Number, default: 0 },           // sum of all rules calculated
  totalPrice: { type: Number, default: 0 },                // basePrice + rulesPriceTotal

  // Rules list
  rules: [RuleSchema],

  // Feature status
}, { timestamps: true });

module.exports = mongoose.model("Feature", FeatureSchema);
