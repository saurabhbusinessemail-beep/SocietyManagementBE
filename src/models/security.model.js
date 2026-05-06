const mongoose = require('mongoose');

const SecuritySchema = new mongoose.Schema({
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },

  // For Tenants specially
  jobStart: { type: Date, required: true },
  jobEnd: { type: Date },
  salaryAmount: { type: Number },
  documents: [{ type: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' },

  ...require('./default-fields.model')
}, { timestamps: true });

// Most frequent query: check if user is active security for a society
SecuritySchema.index({ societyId: 1, userId: 1, status: 1 });
// For listing all security by society with status filter
SecuritySchema.index({ societyId: 1, status: 1 });

module.exports = mongoose.model('Security', SecuritySchema);
