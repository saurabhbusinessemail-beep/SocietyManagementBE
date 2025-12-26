const buildingService = require('../services/building.service');

export const createBuilding = async (req, res, next) => {
  try {
    let building = req.body;
    if (building.managerId) {
      building.managerId = await buildingService.getBuildingManagerUser(building.managerId);
    }
    const data = await buildingService.createBuilding(building);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const bulkCreateBuildings = async (req, res, next) => {
  try {
    const data = await buildingService.bulkCreateBuildings(req.body);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

export const getBuildingsBySociety = async (req, res, next) => {
  try {
    const societyId = req.params.id;
    const filter = { ...(res.locals.filter ?? {}), societyId };
    const { page, limit } = req.query;
    const data = await buildingService.getBuildingsBySociety(
      societyId,
      filter,
      {
        page: Number(page),
        limit: Number(limit)
      }
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getBuildingById = async (req, res, next) => {
  try {
    const data = await buildingService.getBuildingById(req.params.id);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

export const updateBuilding = async (req, res, next) => {
  try {
    let building = req.body;
    if (building.managerId) {
      building.managerId = await buildingService.getBuildingManagerUser(building.managerId);
    }
    const data = await buildingService.updateBuilding(
      req.params.buildingId,
      building
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteBuilding = async (req, res, next) => {
  try {
    const data = await buildingService.deleteBuilding(req.params.buildingId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Building manager CRUD
 */
export const updateBuildingManager = async (req, res, next) => {
  try {
    const { managerId } = req.body;
    const data = await buildingService.updateBuildingManager(
      req.params.id,
      managerId
    );
    res.success(data);
  } catch (err) {
    next(err);
  }
};
