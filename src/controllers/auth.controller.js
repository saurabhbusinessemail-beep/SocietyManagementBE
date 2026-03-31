import * as UserService from '../services/user.service';
import * as AuthService from '../services/auth.service';
import * as SMSService from '../services/sms.service';
import * as NotificationService from '../services/notification.service';

const { User, Otp } = require('../models');

// STEP 1: Generate OTP
export const requestOtp = async (req, res) => {
  try {
    const { phoneNumber, fcmToken } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if user exists with this phoneNumber
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      const newUser = {
        phoneNumber,
        fcmToken
      };
      await UserService.newUser(newUser);
    } else {
      await UserService.updateFCMToken(user._id, fcmToken);
    }

    // Generate random 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP temporarily
    await Otp.create({ phoneNumber, otp });

    console.log(`OTP for ${phoneNumber}: ${otp}`); // For Dev, remove in production

    // Send Notification
    if (fcmToken) await NotificationService.sendOTPNotification(user, user, otp, fcmToken);
    const smsSent = await SMSService.sendOTPMessage(otp, `+91${phoneNumber}`);
    if (smsSent) console.log('SMS Sent');

    return res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// STEP 2: Verify OTP + generate JWT token
export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    // check OTP
    const validOtp = await Otp.findOne({ phoneNumber, otp });

    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP matched → Delete the OTP record (optional)
    await Otp.deleteMany({ phoneNumber });

    // Fetch user
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch Token
    const token = await AuthService.getUserToken(user);

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ME API: Get user details from JWT token
export const getProfile = async (req, res) => {
  try {
    const user = res.locals.user;
    const socities = res.locals.socities ?? [];
    const allMenus = res.locals.allMenus ?? [];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const response = {
      success: true,
      profile: {
        user,
        socities,
        allMenus
      }
    };

    // Optional: Add cache indicator for debugging
    if (res.locals.fromCache) {
      response.metadata = {
        fromCache: true,
        cachedAt: new Date().toISOString()
      };
    }

    return res.json(response);
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};
