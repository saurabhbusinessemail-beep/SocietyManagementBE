const express = require("express");
import { userAuth } from '../middlewares/auth.middleware';
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Step 1 → Request OTP
router.post("/request-otp", authController.requestOtp);

// Step 2 → Verify OTP
router.post("/verify-otp", authController.verifyOtp);

// Get profile using token
router.get("/me", userAuth, authController.getProfile);

export default router;
