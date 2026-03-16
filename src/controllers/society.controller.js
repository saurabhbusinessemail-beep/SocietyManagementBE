import * as societyService from '../services/society.service';
import * as userService from '../services/user.service';
import * as NotificationService from '../services/notification.service';
const { User } = require('../models');

/**
 * Get all societies
 */
export const getAllSocieties = async (req, res, next) => {
  try {
    const filter = res.locals.filter ?? {};
    const { page, limit } = req.query;
    const data = await societyService.getAllSocieties(filter, {
      page: Number(page),
      limit: Number(limit)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all unapproved societies
 */
export const getAllUnApprovedSocieties = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { searchString } = req.body;

    const data = await societyService.getAllUnApprovedSocieties({
      page: Number(page),
      limit: Number(limit),
      searchString
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all societies logged in user sent for approval
 */
export const getMySocietiesForApproval = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { searchString } = req.body;
    const user = res.locals.user;

    const data = await societyService.getMySocietiesForApproval(user._id, {
      page: Number(page),
      limit: Number(limit),
      searchString
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Get single society
 */
export const getSociety = async (req, res, next) => {
  try {
    const data = await societyService.getSociety(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getSocietyManagers = async (req, res) => {
  try {
    const data = await societyService.getSocietyManagers(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Create society
 */
export const newSociety = async (req, res, next) => {
  try {
    const defaultPhone = '0000000000';
    const user = res.locals.user;
    const isAdmin = user?.role === 'admin';

    const extension = !isAdmin ? { isApproved: false } : { addedByAdmin: true };
    const payload = {
      ...req.body,
      ...extension,
      adminContacts: [user._id]
    }
    const data = await societyService.newSociety(payload);
    res.status(201).json(data);
  } catch (err) {
    if (err.code === 11000)
      next(new Error('Society name already exists'))
    else
      next(err);
  }
};

/**
 * Update society
 */
export const updateSociety = async (req, res, next) => {
  try {
    const data = await societyService.updateSociety(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * ApproveReject society
 */
export const approveRejectSociety = async (req, res, next) => {
  try {
    const payload = req.body;
    const isApproved = payload?.['approved'] && payload['approved'] === true;
    const data = isApproved ?
      await societyService.approveSociety(req.params.id)
      : await societyService.rejectSociety(req.params.id);

    const fromUser = res.locals.user;
    const toUserId = data.createdByUserId;
    const toUser = userService.getUser(toUserId);

    if (toUser.fcmToken) {
      NotificationService.sendApproveRejectSocietyNotification(fromUser, toUserId, data, toUser.fcmToken, isApproved);
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete society
 */
export const deleteSociety = async (req, res, next) => {
  try {
    await societyService.deleteSociety(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Search societies
 */
export const searchSocieties = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    const data = await societyService.searchSocieties(q, {
      page: Number(page),
      limit: Number(limit)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const newSocietyManager = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    let payload = req.body;
    if (!payload._id) {
      payload = await userService.findOrCreateUser(payload);
    }
    await societyService.newSocietyManager(societyId, payload);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const deleteSocietyManager = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    const managerId = req.params.managerId;
    await societyService.deleteSocietyManager(societyId, managerId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const newSocietyAdmin = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    let payload = req.body;
    if (!payload._id) {
      payload = await userService.findOrCreateUser(payload);
    }
    await societyService.newSocietyAdmin(societyId, payload);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const deleteSocietyAdmin = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    const adminId = req.params.adminId;
    await societyService.deleteSocietyAdmin(societyId, adminId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
