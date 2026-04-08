const parkingService = require('../services/parking.service');

export const createParking = async (req, res, next) => {
  try {
    const { societyId, buildingId, parkingNumber } = req.body;
    if (await parkingService.parkingExists(societyId, buildingId, parkingNumber)) {
      return res.status(409).json({ success: false, message: 'Same parking number already exists.' });
    }

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

    // Check if any parking number already exists for given society and building
    const existingParking = false;
    for (let i = 0; i < parkings.length; i++) {
      const p = parkings[i];
      if (await parkingService.parkingExists(p.societyId, p.buildingId, p.parkingNumber)) {
        existingParking = p;
        break;
      }
    }
    if (existingParking) {
      return res.status(409).json({ success: false, message: `Parking number ${existingParking.parkingNumber} already exists. No Parking created` })
    }

    parkings.forEach((parking) => {
      parking.createdOn = new Date();
      parking.createdByUserId = user._id;
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
    const data = await parkingService.updateParking(req.params.parkingId, parking);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getParkingsBySocietyAndBuilding = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const societyId = req.params.societyId;
    const buildingId = req.params.buildingId;
    const flatId = req.params.flatId;
    let filter = {
      ...(res.locals.filter ?? {}),
      societyId
    };
    if (buildingId) filter['buildingId'] = buildingId;
    if (flatId) filter['flatId'] = flatId;

    const data = await parkingService.getParkingsBySocietyAndBuilding(filter, {
      page: Number(page),
      limit: Number(limit)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteParking = async (req, res, next) => {
  try {
    const data = await parkingService.deleteParking(req.params.parkingId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
