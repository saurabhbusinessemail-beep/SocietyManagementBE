const mongoose = require("mongoose");

const FeatureSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },     // machine readable key
  name: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Feature", FeatureSchema);
