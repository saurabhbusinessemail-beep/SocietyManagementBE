const flatService = require('../services/flat.service');

export const createFlat = async (req, res, next) => {
  try {
    const data = await flatService.createFlat(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const bulkCreateFlats = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user || !user._id) {
      return res.status(403).json({
        message: 'Access denied: no user identified.'
      });
    }

    let flats = req.body;
    flats.forEach((flat) => {
      flat.createdOn = new Date();
      flat.craetedByUserId = user._id;
    });
    const data = await flatService.bulkCreateFlats(flats);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getFlatsBySocietyAndBuilding = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    const buildingId = req.params.buildingId;
    let filter = {
      ...(res.locals.filter ?? {}),
      societyId
    };
    if (buildingId) filter['buildingId'] = buildingId;

    const data = await flatService.getFlatsBySocietyAndBuilding(filter);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getFlatById = async (req, res, next) => {
  try {
    const data = await flatService.getFlatById(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateFlat = async (req, res, next) => {
  try {
    const data = await flatService.updateFlat(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteFlat = async (req, res, next) => {
  try {
    const data = await flatService.deleteFlat(req.params.flatId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
