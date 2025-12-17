import * as societyService from '../services/society.service';

/**
 * Get all societies
 */
export const getAllSocieties = async (req, res, next) => {
  try {
    const data = await societyService.getAllSocieties();
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
