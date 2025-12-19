const buildingService = require('../services/building.service');

export const createBuilding = async (req, res, next) => {
  try {
    const data = await buildingService.createBuilding(req.body);
    res.success(data);
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
    const { societyId } = req.query || req.body;
    const data = await buildingService.getBuildingsBySociety(societyId);
    res.success(data);
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
    const data = await buildingService.updateBuilding(req.params.id, req.body);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

export const deleteBuilding = async (req, res, next) => {
  try {
    const data = await buildingService.deleteBuilding(req.params.id);
    res.success(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Building Secretary CRUD
 */
export const updateBuildingSecretary = async (req, res, next) => {
  try {
    const { secreataryId } = req.body;
    const data = await buildingService.updateBuildingSecretary(
      req.params.id,
      secreataryId
    );
    res.success(data);
  } catch (err) {
    next(err);
  }
};
