const mongoose = require('mongoose');

const TenantDocumentSchema = new mongoose.Schema({
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatId: { type: mongoose.Types.ObjectId, ref: 'Flat', required: true },
  tenantId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  flatMemberId: { type: mongoose.Types.ObjectId, ref: 'FlatMember', required: true },

  documentName: { type: String, required: true },
  documentUrl: { type: String, required: true },
  documentType: { type: String },

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  
  approvedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },

  ...require('./default-fields.model')
}, { timestamps: true });

module.exports = mongoose.model('TenantDocument', TenantDocumentSchema);
