import { Society } from '../models';
import * as SecurityService from '../services/security.service';

/**
 * Get all societies
 */
export const getAllSocieties = async (filter, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Society.find(filter).skip(skip).limit(limit).sort({ societyName: 1 }),
    Society.countDocuments(filter)
  ]);

  // const data = await Society.find(filter).sort({ createdAt: -1 });
  return {
    data,
    total,
    page,
    limit,
    success: true
  };
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
  const data = await Society.findById(id)
    .populate('adminContacts')
    .populate('managerIds');
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
    limit,
    success: true
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

export const getMySocities = async (userId, withSocietyRoles = false) => {
  const myContactAdminSocities = await contactAdminSocieties(userId);
  const myManagerSocities = await managerSocieties(userId);
  const mySecuritySocities = await SecurityService.getSecuritySocities(
    userId,
    withSocietyRoles
  );

  if (!withSocietyRoles)
    return { socities: [...myContactAdminSocities, ...myManagerSocities] };

  // Create { [societyId: string]: string[] }
  let societiesObj = {};
  myContactAdminSocities.forEach((society) => {
    societiesObj[society._id] = ['societyadmin'];
  });
  myManagerSocities.forEach((society) => {
    if (societiesObj[society._id]) societiesObj[society._id].push('manager');
    else societiesObj[society._id] = ['manager'];
  });
  mySecuritySocities.forEach((security) => {
    if (societiesObj[security.societyId])
      societiesObj[security.societyId].push('security');
    else societiesObj[security.societyId] = ['security'];
  });

  let rolesObj = new Set();
  let socities = [];
  for (let key of Object.keys(societiesObj)) {
    const societyId = key;
    const roles = societiesObj[key];
    roles.forEach((role) => rolesObj.add(role));
    socities.push({ societyId, societyRoles: roles });
  }
  const roles = [...rolesObj.values()];
  return { socities, roles };
};

export const newSocietyManager = async (societyId, manager) => {
  const society = await Society.findById(societyId);
  if (!society.managerIds) society.managerIds = [];

  if (!society.managerIds.some((m) => m === manager._id))
    society.managerIds.push(manager._id);

  await Society.findByIdAndUpdate({ _id: societyId }, society, { new: true });
};

export const deleteSocietyManager = async (societyId, managerId) => {
  const society = await Society.findById(societyId);
  if (!society.managerIds) society.managerIds = [];
  society.managerIds = society.managerIds.filter((m) => m != managerId);

  await Society.findByIdAndUpdate({ _id: societyId }, society, { new: true });
};
