import { Parking } from '../models';

export const createParking = (data) => {
  return Parking.create(data);
};

export const bulkCreateParkings = (payload) => {
  return Parking.insertMany(payload);
};

export const updateParking = async (_id, body) => {
  const data = await Parking.findByIdAndUpdate({ _id }, body, { new: true });
  return data;
};

export const deleteParking = async (id) => {
  await Parking.findByIdAndDelete(id);
  return '';
};

export const getParkingsBySocietyAndBuilding = async (filter, options = {}) => {
  const { page = 1, limit = 500 } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Parking.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ floor: 1, flatNumber: 1 })
      .populate('flatId'),
    Parking.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};
