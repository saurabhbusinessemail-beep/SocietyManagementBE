import * as UserService from '../services/user.service';
import * as MenuService from '../services/menu.service';
import * as userUtils from '../utils/user.util';

const jwt = require('jsonwebtoken');
const { User, Otp } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'skSecret';

// STEP 1: Generate OTP
export const requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if user exists with this phoneNumber
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      const newUser = {
        phoneNumber
      };
      await UserService.newUser(newUser);
      // return res
      //   .status(404)
      //   .json({ message: 'User not found with this phoneNumber' });
    }

    // Generate random 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP temporarily
    await Otp.create({ phoneNumber, otp });

    console.log(`OTP for ${phoneNumber}: ${otp}`); // For Dev, remove in production

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
      return res
        .status(400)
        .json({ message: 'Phone number and OTP are required' });
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
    const jwtUser = {
      _id: user._id.toString(),
      name: user.name,
      phoneNumber: user.phoneNumber,
      status: user.status,
      profilePic: user.profilePic,
      role: user.role
    };

    // Fetch Socities and Roles
    const { socities, roles } = await userUtils.userSocitiesWithRole(user._id);

    // Get Menus
    const allMenus =
      user.role === 'user'
        ? await MenuService.getRoleMenu(roles)
        : await MenuService.getAllMenu();

    // Generate JWT with basic info only
    const token = jwt.sign(
      {
        user: jwtUser,
        socities,
        allMenus
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
    // Fetch user
    const user = res.locals.user;
    const socities = res.locals.socities ?? [];
    const allMenus = res.locals.allMenus ?? [];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      success: true,
      profile: {
        user,
        socities,
        allMenus
      }
    });
  } catch (err) {
    console.error(err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};
