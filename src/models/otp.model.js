const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  otp: { type: String, required: true },
  // createdAt: { type: Date, default: Date.now, expires: 300 } // 5 minutes
});

module.exports = mongoose.model("Otp", OtpSchema);
