const express = require("express");
import { userAuth } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';
const authController = require("../controllers/auth.controller");

const router = express.Router();

// Step 1 → Request OTP (Rate limited to block OTP spam/brute forcing)
router.post("/request-otp", authLimiter, authController.requestOtp);

// Step 2 → Verify OTP (Rate limited to prevent OTP guessing)
router.post("/verify-otp", authLimiter, authController.verifyOtp);

// Get profile using token
router.get("/me", userAuth, authController.getProfile);


// router.get("/getAllRoleMenus", authController.getAllRoleMenus);

export default router;
