const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Step 1 → Request OTP
router.post("/request-otp", authController.requestOtp);

// Step 2 → Verify OTP
router.post("/verify-otp", authController.verifyOtp);

// Get profile using token
router.get("/me", authController.getProfile);

module.exports = router;
