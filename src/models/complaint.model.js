const mongoose = require('mongoose');

const ComplaintCommentSchema = new mongoose.Schema({
  commenterId: { type: String }, // user id as string
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ComplaintHistorySchema = new mongoose.Schema({
  changedBy: { type: String },
  changedAt: { type: Date, default: Date.now },
  fromStatus: { type: String },
  toStatus: { type: String },
  note: { type: String }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true },
  flatId: { type: String },
  societyId: { type: String },
  raisedBy: { type: String }, // user id
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed', 'rejected'], default: 'open' },
  assignedTo: { type: String },
  comments: [ComplaintCommentSchema],
  history: [ComplaintHistorySchema],
  attachments: [{ type: String }], // urls
  resolutionNote: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
