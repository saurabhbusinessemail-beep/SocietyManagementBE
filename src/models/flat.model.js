const mongoose = require('mongoose');

const FlatSchema = new mongoose.Schema({
  flatNumber: { type: String, required: true }, // e.g. 'A-101'
  buildingId: { type: mongoose.Types.ObjectId, ref: 'Building' },
  societyId: { type: mongoose.Types.ObjectId, ref: 'Society', required: true },
  flatType: { type: String, enum: ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK', '6BHK'] },
  floor: { type: Number },
  flatMemberId: { type: String, ref: 'FlatMember' },

  meta: { type: mongoose.Schema.Types.Mixed },

  ...require('./default-fields.model')
}, { timestamps: true });

module.exports = mongoose.model('Flat', FlatSchema);
