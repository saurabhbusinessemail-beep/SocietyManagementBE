import * as UserService from '../services/user.service';
import * as SocietyService from '../services/society.service';
import * as FlatService from '../services/flat.service';

const jwt = require('jsonwebtoken');
const { User, Otp, SocietyRole } = require('../models');

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

    // Generate JWT with basic info only
    const token = jwt.sign(
      {
        _id: user._id.toString(),
        name: user.name,
        phoneNumber: user.phoneNumber,
        status: user.status,
        profilePic: user.profilePic,
        role: user.role
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
    const user = res.locals.user; // await User.findById(res.locals.user.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find my roles and my socities and flats
    const myContactAdminSocities = await SocietyService.contactAdminSocieties(
      user._id
    );
    const myManagerSocities = await SocietyService.managerSocieties(user._id);
    const flatMembers = await FlatService.myFlats(user._id);
    const myOwnerFlatMemberRecords = flatMembers.filter((f) => f.isOwner);
    const myTenantFlatMemberRecords = flatMembers.filter((f) => f.isTenant);
    const myMemberFlatMemberRecords = flatMembers.filter(
      (f) => !f.isOwner && !f.isTenant
    );

    let societiesObj = [];
    myContactAdminSocities.forEach((society) => {
      societiesObj[society._id] = ['societyadmin'];
    });
    myManagerSocities.forEach((society) => {
      if (societiesObj[society._id]) societiesObj[society._id].push('manager');
      else societiesObj[society._id] = ['manager'];
    });
    myOwnerFlatMemberRecords.forEach((flatMember) => {
      if (societiesObj[flatMember.societyId])
        societiesObj[flatMember.societyId].push('owner');
      else societiesObj[flatMember.societyId] = ['owner'];
    });
    myTenantFlatMemberRecords.forEach((tenant) => {
      if (societiesObj[tenant.societyId])
        societiesObj[tenant.societyId].push('tenant');
      else societiesObj[tenant.societyId] = ['tenant'];
    });
    myMemberFlatMemberRecords.forEach((member) => {
      if (societiesObj[member.societyId])
        societiesObj[member.societyId].push('member');
      else societiesObj[member.societyId] = ['member'];
    });

    let rolesObj = new Set();
    let socities = [];
    for (let key in Object.keys(societiesObj)) {
      const societyId = key;
      const roles = societiesObj[key];

      roles.forEach((role) => rolesObj.add(role));
      socities.push({ societyId, societyRoles: roles });
    }

    // Get Role Objects and map to society roles
    const roles = [...rolesObj.values()];
    const rolesFromDB = await SocietyRole.find({ name: { $in: roles } });
    societiesObj.forEach((society) => {
      society.societyRoles = society.societyRoles.map(
        (role) => rolesFromDB.find((rdb) => rdb.name === role) ?? { role }
      );
    });

    // Get Menus
    const allMenus = user.role === 'user'
    ? await UserService.getRoleMenu(roles)
    : await UserService.getAllMenu();

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
