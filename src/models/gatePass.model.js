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

    OTP: { type: Number, required: true },
    expectedDate: { type: Date },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

module.exports = mongoose.model('GatePass', GatePassSchema);
