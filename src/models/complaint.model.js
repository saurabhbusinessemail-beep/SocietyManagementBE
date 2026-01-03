const mongoose = require('mongoose');

const ComplaintCommentSchema = new mongoose.Schema({
  comment: { type: String, required: true },
}, { _id: false });

const ComplaintHistorySchema = new mongoose.Schema({
  fromStatus: { type: String },
  toStatus: { type: String },
  note: { type: String }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
  flatId: { type:  mongoose.Types.ObjectId, ref: 'Flat', required: true },
  societyId: { type:  mongoose.Types.ObjectId, ref: 'Society', required: true },

  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },

  complaintType: { type: String, enum: ['Public', 'Private'], default: 'Private' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'], default: 'open' },
  assignedTo: { type: mongoose.Types.ObjectId, ref: 'User' },
  
  comments: [ComplaintCommentSchema],
  history: [ComplaintHistorySchema],
  // attachments: [{ type: String }], // urls
  resolutionNote: { type: String },

  ...require('./default-fields.model')
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
1