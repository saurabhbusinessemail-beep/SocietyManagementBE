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

export const getBuildingsBySociety = async (filter, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([Building.find(filter).skip(skip).limit(limit).sort({ createdOn: -1 }).populate('managerId').populate('societyId').populate('createdByUserId').populate('modifiedByUserId'), Building.countDocuments(filter)]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const gettBuilding = async (id) => {
  const data = await Building.findById(id).populate('managerId').populate('societyId').populate('createdByUserId').populate('modifiedByUserId');
  return data;
};

export const updateBuilding = async (_id, body) => {
  const building = await Building.findById(_id);
  if (!building) {
    throw new Error('Building not found');
  }

  const data = await Building.findByIdAndUpdate({ _id }, body, { new: true });
  return data;
};

export const deleteBuilding = async (id) => {
  const building = await Building.findById(id);
  if (!building) {
    throw new Error('Building not found');
  }

  await Building.findByIdAndDelete(id);
  return { success: true };
};