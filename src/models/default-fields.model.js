const mongoose = require("mongoose");

module.exports = {
  createdOn: { type: Date, required: true },
  createdByUserId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedOn: { type: Date },
  modifiedByUserId: {
    type: mongoose.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: { type: Boolean }
};
