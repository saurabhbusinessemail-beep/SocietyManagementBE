import * as societyService from '../services/society.service';
import * as userService from '../services/user.service';
import * as NotificationService from '../services/notification.service';
import * as securityService from '../services/security.service';

/**
 * Get all societies
 */
export const getAllSocieties = async (req, res, next) => {
  try {
    const filter = res.locals.filter ?? {};
    // console.log('getAllSocieties filter = ', filter);
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
    const { searchString, status } = req.body;

    const data = await societyService.getAllUnApprovedSocieties(status, {
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
    const { searchString, status } = req.body;
    const user = res.locals.user;

    const data = await societyService.getMySocietiesForApproval(user._id, status, {
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
    const { societyId } = req.params;
    const data = await societyService.getSociety(societyId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getSocietyManagers = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const data = await societyService.getSocietyManagers(societyId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getSocietySecurities = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const { page, limit } = req.query;
    const data = await securityService.getSocietySecurities(societyId, {
      page: Number(page),
      limit: Number(limit)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteSocietySecurity = async (req, res, next) => {
  try {
    const { societyId, securityId } = req.params;
    const data = await securityService.deleteSocietySecurity(securityId);
    res.json({ success: true, message: 'Security removed successfully' });
  } catch (err) {
    next(err);
  }
}

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
    const { societyId } = req.params;
    const data = await societyService.updateSociety(societyId, req.body);
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
    const { societyId } = req.params;
    const payload = req.body;
    const isApproved = payload?.['approved'] && payload['approved'] === true;
    const data = isApproved ?
      await societyService.approveSociety(societyId)
      : await societyService.rejectSociety(societyId);

    const fromUser = res.locals.user;
    const toUserId = data.createdByUserId;
    const toUser = await userService.getUser(toUserId);

    if (toUser?.fcmToken) {
      await NotificationService.sendApproveRejectSocietyNotification(fromUser, toUserId, data, toUser.fcmToken, isApproved);
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
    const { societyId } = req.params;
    await societyService.deleteSociety(societyId);
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
    const { societyId } = req.params;
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
    const { societyId, managerId } = req.params;
    await societyService.deleteSocietyManager(societyId, managerId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const newSocietyAdmin = async (req, res, next) => {
  try {
    const { societyId } = req.params;
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
    const { societyId, adminId } = req.params;
    await societyService.deleteSocietyAdmin(societyId, adminId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};