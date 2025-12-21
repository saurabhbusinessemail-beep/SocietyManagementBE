const mongoose = require('mongoose');

const FlatMemberSchema = new mongoose.Schema({
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  contact: { type: String, required: true }, 
  isOwner: { type: Boolean, default: false },
  isTenant: { type: Boolean, default: false },

  ...require('./default-fields.model')
}, { timestamps: true });

module.exports = mongoose.model('FlatMember', FlatMemberSchema);
