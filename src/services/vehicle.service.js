import { Vehicle } from '../models';

export const createVehicle = (data) => {
  return Vehicle.create(data);
};

export const deleteVehicle = async (id) => {
  await Vehicle.findByIdAndDelete(id);
  return '';
};

export const getVehicles = async (filter, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Vehicle.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdOn: 1 })
      .populate('flatId')
      .populate('createdByUserId'),
      Vehicle.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};