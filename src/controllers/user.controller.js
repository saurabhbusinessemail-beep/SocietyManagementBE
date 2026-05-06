import HttpStatus from 'http-status-codes';
import * as UserService from '../services/user.service';
import * as AuthService from '../services/auth.service';
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

/**
 * Controller to get all users available
 * @param  {object} req - request object
 * @param {object} res - response object
 * @param {Function} next
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const filter = {}; // Add any filters you need from req.query

    const data = await UserService.getAllUsers(filter, {
      page: Number(page) || 1,
      limit: Number(limit) || 20
    });

    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      ...data,
      message: 'All users fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get a single user
 * @param  {object} req - request object
 * @param {object} res - response object
 * @param {Function} next
 */
export const getUser = async (req, res, next) => {
  try {
    const data = await UserService.getUser(req.params._id);
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: data,
      message: 'User fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to create a new user
 * @param  {object} req - request object
 * @param {object} res - response object
 * @param {Function} next
 */
export const newUser = async (req, res, next) => {
  try {
    const data = await UserService.newUser(req.body);
    res.status(HttpStatus.CREATED).json({
      code: HttpStatus.CREATED,
      data: data,
      message: 'User created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update a user
 * @param  {object} req - request object
 * @param {object} res - response object
 * @param {Function} next
 */
export const updateUser = async (req, res, next) => {
  try {
    const data = await UserService.updateUser(req.params._id, req.body);
    res.status(HttpStatus.ACCEPTED).json({
      code: HttpStatus.ACCEPTED,
      data: data,
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Update User Name
export const updateName = async (req, res, next) => {
  try {
    const { userName } = req.body;
    const user = res.locals.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const data = await UserService.updateUserName(user._id, userName);
    const updatedToken = await AuthService.getUserToken(data);
    res.status(201).json({
      success: true,
      message: 'User Name Updated',
      token: updatedToken
    });
  } catch (error) {
    next(error);
  }
};

// Update FCM Token
export const updateFCMToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    const user = res.locals.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const data = await UserService.updateFCMToken(user._id, fcmToken);
    res.status(201).json({
      success: true,
      message: 'FCM Token Updated'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete a user
 * @param  {object} req - request object
 * @param {object} res - response object
 * @param {Function} next
 */
export const deleteUser = async (req, res, next) => {
  try {
    await UserService.deleteUser(req.params._id);
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: [],
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to search a user
 * @param  {object} req - request object
 * @param {object} res - response object
 * @param {Function} next
 */
export const searchUser = async (req, res, next) => {
  try {
    const data = await UserService.searchUsers(req.params._searchText);
    res.status(HttpStatus.OK).json({
      success: true,
      ...data,
      message: ''
    });
  } catch (error) {
    next(error);
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res, next) => {
  try {
    const { profilePicture } = req.body;
    const userId = res.locals.user._id;

    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture data provided'
      });
    }

    // Validate base64 image format
    if (!profilePicture.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Please provide a valid base64 image'
      });
    }

    // Check file size (approximate - base64 is ~33% larger than binary)
    const base64Size = Buffer.byteLength(profilePicture, 'utf8');
    const estimatedFileSize = base64Size * 0.75; // Approximate binary size

    if (estimatedFileSize > 2 * 1024 * 1024) {
      // 2MB limit
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 2MB'
      });
    }

    // Update user with new profile picture (base64)
    const user = await User.findByIdAndUpdate(userId, { profilePicture: profilePicture }, { new: true }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: user.profilePicture
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    next(error)
  }
};

export const getMyProfilePicture = async (req, res, next) => {
  try {
    const user = res.locals.user;
    const profilePicture = await UserService.getProfilePicture(user._id);
    res.status(HttpStatus.OK).json({
      success: true,
      data: profilePicture ?? '',
      message: ''
    });
  } catch (error) {
    next(error)
  }
}
