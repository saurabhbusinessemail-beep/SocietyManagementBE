const mongoose = require('mongoose');

const GatePassSchema = new mongoose.Schema(
  {
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true
    },

    flatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
      index: true
    },

    isAssignedBySociety: { type: Boolean },

    otp: { type: Number, required: true },
    expectedDate: { type: Date, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    remarks: {
      type: String,
      trim: true
    },

    ...require('./default-fields.model')
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound: most common query pattern is societyId + flatId
GatePassSchema.index({ societyId: 1, flatId: 1 });
// userId ref used for owner gate-pass lookups
GatePassSchema.index({ userId: 1 });
GatePassSchema.index({ societyId: 1, userId: 1 });

module.exports = mongoose.model('GatePass', GatePassSchema);
