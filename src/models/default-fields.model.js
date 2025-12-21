module.exports = {
  createdOn: { type: Date, required: true },
  craetedByUserId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedOn: { type: Date },
  modifiedByUserId: { type: Date },
  isDeleted: { type: Boolean }
};
