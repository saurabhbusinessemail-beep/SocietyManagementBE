import { Society } from '../models';

/**
 * Get all societies
 */
export const getAllSocieties = async () => {
  const data = await Society.find().sort({ createdAt: -1 });
  return data;
};

/**
 * Create new society
 */
export const newSociety = async (body) => {
  const data = await Society.create(body);
  return data;
};

/**
 * Update single society
 */
export const updateSociety = async (_id, body) => {
  const data = await Society.findByIdAndUpdate({ _id }, body, { new: true });
  return data;
};

/**
 * Delete single society
 */
export const deleteSociety = async (id) => {
  await Society.findByIdAndDelete(id);
  return '';
};

/**
 * Get single society
 */
export const getSociety = async (id) => {
  const data = await Society.findById(id);
  return data;
};

/**
 * Search societies (by name or address)
 */
export const searchSocieties = async (search, options = {}) => {
  const { page = 1, limit = 20 } = options;

  if (!search || !search.trim()) {
    return {
      data: [],
      total: 0,
      page,
      limit
    };
  }

  const regex = new RegExp(search.trim(), 'i');

  const filter = {
    $or: [{ societyName: regex }, { 'gpsLocation.address': regex }]
  };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Society.find(filter).skip(skip).limit(limit).sort({ societyName: 1 }),
    Society.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit
  };
};

export const contactAdminSocieties = async (userId) => {
  return await Society.find({
    adminContacts: { $in: userId }
  });
};

export const managerSocieties = async (userId) => {
  return await Society.find({
    managerIds: { $in: userId }
  });
};
