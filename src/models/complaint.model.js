const mongoose = require('mongoose');

const ComplaintCommentSchema = new mongoose.Schema({
  // commenterId: { type: String }, // user id as string
  comment: { type: String, required: true },
  // createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ComplaintHistorySchema = new mongoose.Schema({
  // changedBy: { type: String },
  // changedAt: { type: Date, default: Date.now },
  fromStatus: { type: String },
  toStatus: { type: String },
  note: { type: String }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
  flatId: { type:  mongoose.Types.ObjectId, ref: 'Flat', required: true },
  societyId: { type:  mongoose.Types.ObjectId, ref: 'Society', required: true },
  // raisedBy: { type: String }, // user id
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
