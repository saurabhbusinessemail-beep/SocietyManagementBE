const jwt = require('jsonwebtoken');
const { User, Otp, Role } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

// STEP 1: Generate OTP
exports.requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if user exists with this phoneNumber
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found with this phoneNumber' });
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
exports.verifyOtp = async (req, res) => {
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

    // Generate JWT with basic info only
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        societyId: user.societyId,
        buildingId: user.buildingId,
        flatId: user.flatId
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
exports.getProfile = async (req, res) => {
  try {
    const token = req.headers['authorization'];

    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // -----------------------------------------------------
    // FETCH ALL PERMISSIONS BASED ON USER ROLES
    // -----------------------------------------------------
    let allPermissions = [];

    if (user.role) {
      const role = await Role.findOne({ name: user.role });

      if (role.permissions && Array.isArray(role.permissions)) {
        allPermissions.push(...role.permissions);
      }
    }

    // Merge + remove duplicates
    allPermissions = [...new Set(allPermissions)];

    return res.json({
      success: true,
      user: user,
      permissions: allPermissions
    });
  } catch (err) {
    console.error(err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};
