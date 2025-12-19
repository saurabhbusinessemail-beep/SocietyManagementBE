import { Building } from '../models';

export const createBuilding = (data) => {
  return Building.create({
    ...data,
    societyId: data.societyId
  });
};

export const bulkCreateBuildings = ({ societyId, buildings }) => {
  return Building.insertMany(buildings.map((b) => ({ ...b, societyId })));
};

export const getBuildingsBySociety = (societyId) => {
  return Building.find({ societyId });
};
