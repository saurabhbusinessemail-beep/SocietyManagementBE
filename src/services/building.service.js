import { Building } from '../models';
import * as userService from '../services/user.service';

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
  const [data, total] = await Promise.all([
    Building.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdOn: -1 })
      .populate('managerId'),
    Building.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const gettBuilding = async (id) => {
  const data = await Building.findById(id).populate('managerId');
  return data;
};

export const updateBuilding = async (_id, body) => {
  const data = await Building.findByIdAndUpdate({ _id }, body, { new: true });
  return data;
};

export const deleteBuilding = async (id) => {
  await Building.findByIdAndDelete(id);
  return '';
};

export const getBuildingManagerUser = async (manager) => {
  if (!manager._id) {
    const users = await userService.searchUsers(manager.phoneNumber);
    if (users.data.length > 0) {
      return users.data[0];
    } else {
      const newUser = userService.newUser(manager);
      return newUser._id;
    }
  }
  return manager._id;
};
