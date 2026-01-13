import HttpStatus from 'http-status-codes';
import * as UserService from '../services/user.service';
import * as AuthService from '../services/auth.service';

/**
 * Controller to get all users available
 * @param  {object} req - request object
 * @param {object} res - response object
 * @param {Function} next
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const data = await UserService.getAllUsers();
    res.status(HttpStatus.OK).json({
      code: HttpStatus.OK,
      data: data,
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
      message: 'FCM Token Updated',
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
    const users = await UserService.searchUsers(req.params._searchText);
    res.status(HttpStatus.OK).json({
      success: true,
      ...users,
      message: ''
    });
  } catch (error) {
    next(error);
  }
};
