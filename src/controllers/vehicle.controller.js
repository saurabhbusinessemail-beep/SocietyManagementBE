const vehicleService = require('../services/vehicle.service');

export const createVehicle = async (req, res, next) => {
  try {
    const { flatId, vehicleNumber } = req.params.flatId;
    const payload = { ...req.body, flatId };

    if (await vehicleService.vehicleExists(flatId, vehicleNumber)) {
      return res.status(409).json({
        success: false,
        message: 'Same vehicle number already exists.'
      })
    }

    const data = await vehicleService.createVehicle(payload);
    res.json({ data, success: true });
  } catch (err) {
    next(err);
  }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    const data = await vehicleService.deleteVehicle(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getVehicles = async (req, res, next) => {
  try {
    const filter = { flatId: req.params.flatId };
    const { page, limit } = req.query;
    const data = await vehicleService.getVehicles(filter, {
      page: Number(page),
      limit: Number(limit)
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};
