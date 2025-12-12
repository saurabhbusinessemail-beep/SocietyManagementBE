const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String },
  lastVisitedAt: { type: Date },
  knownToFlatId: { type: String }, // reference as string
  notes: { type: String },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', VisitorSchema);
