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
    const { page, limit } = req.query;

    let filter = {
      ...(res.locals.filter ?? {}),
      societyId
    };
    if (buildingId) filter['buildingId'] = buildingId;

    const data = await flatService.getFlatsBySocietyAndBuilding(filter, {
      page: Number(page),
      limit: Number(limit)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getFlatById = async (req, res, next) => {
  try {
    console.log('flatId = ', req.params.flatId)
    const data = await flatService.getFlatById(req.params.flatId);
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
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const myFlats = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    const data = await flatService.myFlats(res.locals.user._id, societyId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const flatMember = async (req, res, next) => {
  try {
    const flatMemberId = req.params.flatMemberId;
    const data = await flatService.flatMember(flatMemberId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
