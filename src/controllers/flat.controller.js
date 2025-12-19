const flatService = require('../services/flat.service');

export const createFlat = async (req, res, next) => {
  try {
    const data = await flatService.createFlat(req.body);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

export const bulkCreateFlats = async (req, res, next) => {
  try {
    const data = await flatService.bulkCreateFlats(req.body);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

export const getFlats = async (req, res, next) => {
  try {
    const filter = {
      societyId: req.query.societyId || req.body.societyId,
      buildingId: req.query.buildingId || req.body.buildingId
    };

    const data = await flatService.getFlats(filter);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

export const getFlatById = async (req, res, next) => {
  try {
    const data = await flatService.getFlatById(req.params.id);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

export const updateFlat = async (req, res, next) => {
  try {
    const data = await flatService.updateFlat(req.params.id, req.body);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

export const deleteFlat = async (req, res, next) => {
  try {
    const data = await flatService.deleteFlat(req.params.id);
    res.success(data);
  } catch (err) {
    next(err);
  }
};
