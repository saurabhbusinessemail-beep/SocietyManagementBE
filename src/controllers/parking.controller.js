const parkingService = require('../services/parking.service');

export const createParking = async (req, res, next) => {
  try {
    const data = await parkingService.createParking(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const bulkCreateParkings = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user || !user._id) {
      return res.status(403).json({
        message: 'Access denied: no user identified.'
      });
    }

    let parkings = req.body;
    parkings.forEach((parking) => {
      parking.createdOn = new Date();
      parking.craetedByUserId = user._id;
    });
    const data = await parkingService.bulkCreateParkings(parkings);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateParking = async (req, res, next) => {
  try {
    let parking = req.body;
    const data = await parkingService.updateParking(
      req.params.parkingId,
      parking
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getParkingsBySocietyAndBuilding = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    const buildingId = req.params.buildingId;
    let filter = {
      ...(res.locals.filter ?? {}),
      societyId
    };
    if (buildingId) filter['buildingId'] = buildingId;

    const data = await parkingService.getParkingsBySocietyAndBuilding(filter);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteParking = async (req, res, next) => {
  try {
    const data = await parkingService.deleteParking(req.params.parkingId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
