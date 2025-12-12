const mongoose = require('mongoose');

const FlatMemberSchema = new mongoose.Schema({
  flatId: { type: String, required: true },
  userId: { type: String, required: true },
  name: { type: String },
  relation: { type: String }, // e.g. 'self', 'spouse', 'child'
  dob: { type: Date },
  isPrimaryOwner: { type: Boolean, default: false },
  isTenant: { type: Boolean, default: false },
  documents: [{ type: mongoose.Schema.Types.Mixed }] // owner docs or identity docs (strings or small subdocs)
}, { timestamps: true });

module.exports = mongoose.model('FlatMember', FlatMemberSchema);
