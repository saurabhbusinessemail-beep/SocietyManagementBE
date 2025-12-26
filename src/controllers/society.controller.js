import * as societyService from '../services/society.service';
import * as userService from '../services/user.service';

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
    const data = await societyService.newSociety(req.body);
    res.status(201).json(data);
  } catch (err) {
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
 * Delete society
 */
export const deleteSociety = async (req, res, next) => {
  try {
    await societyService.deleteSociety(req.params.id);
    res.json('');
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
      // Found if existing user by phone number
      const users = await userService.searchUsers(payload.phoneNumber);
      if (users.data.length > 0) {
        payload = users.data[0];
      } else {
        // No user found hence contact may have been added
        payload = await userService.newUser(payload);
      }
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
