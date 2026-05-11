import { Society, Flat } from '../models';
import * as SecurityService from '../services/security.service';

/*
  Add Mandatory filter:
  Either addedByAdmin: true or isApproved: true
*/
function applyMandatoryFilter(filter = {}) {
  return {
    ...filter,
    $or: [
      { addedByAdmin: true },
      { isApproved: true }
    ]
  };
}


/**
 * Get all societies
 */
export const getAllSocieties = async (filter, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const updatedFilter = applyMandatoryFilter(filter);
  const [data, total] = await Promise.all([
    Society.find(updatedFilter).skip(skip).limit(limit).sort({ societyName: 1 }).populate('adminContacts', 'name email phoneNumber').populate('managerIds', 'name email phoneNumber').populate('createdByUserId', 'name email').populate('modifiedByUserId', 'name email').lean(),
    Society.countDocuments(updatedFilter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

/**
 * Get all unapproved societies
 */
export const getAllUnApprovedSocieties = async (status, options = {}) => {
  const { page = 1, limit = 20, searchString } = options;
  const skip = (page - 1) * limit;

  let filter = {};
  switch (status) {
    case 'pending': filter = { isApproved: false, isRejected: { $ne: true } }; break;
    case 'approved': filter = { isApproved: true }; break;
    case 'rejected': filter = { isApproved: false, isRejected: true }; break;
  }

  // add search filter
  if (searchString && searchString.trim() !== '') {
    filter.societyName = { $regex: searchString.trim(), $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Society.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ societyName: 1 }),

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

/**
 * Get all unapproved societies
 */
export const getMySocietiesForApproval = async (userId, status, options = {}) => {
  const { page = 1, limit = 20, searchString } = options;
  const skip = (page - 1) * limit;

  let filter = {};
  switch (status) {
    case 'pending': filter = { createdByUserId: userId, isApproved: false, isRejected: { $ne: true } }; break;
    case 'approved': filter = { createdByUserId: userId, isApproved: true }; break;
    case 'rejected': filter = { createdByUserId: userId, isApproved: false, isRejected: true }; break;
  }

  // add search filter
  if (searchString && searchString.trim() !== '') {
    filter.societyName = { $regex: searchString.trim(), $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Society.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ societyName: 1 }),

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
  const existingFlatCount = await Flat.countDocuments({ societyId: _id });
  if (existingFlatCount > body.numberOfFlats) {
    throw new Error(`You have already added ${existingFlatCount} flats for this society. You cannot decrease the flat count without removing some flats.`)
  }
  const data = await Society.findByIdAndUpdate({ _id }, body, { new: true });
  return data;
};

/**
 * Approve single society
 */
export const approveSociety = async (_id) => {
  const data = await Society.findByIdAndUpdate({ _id }, { isApproved: true }, { new: true });
  return data;
};

/**
 * Reject single society
 */
export const rejectSociety = async (_id) => {
  const data = await Society.findByIdAndUpdate({ _id }, { isApproved: false, isRejected: true }, { new: true });
  return data;
};

/**
 * Delete single society
 */
export const deleteSociety = async (id) => {
  await Society.findByIdAndDelete(id);
  return { success: true };
};

/**
 * Get single society
 */
export const getSociety = async (id) => {
  const data = await Society.findById(id).populate('adminContacts').populate('managerIds').populate('createdByUserId');
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
  const updatedFilter = applyMandatoryFilter(filter);

  const [data, total] = await Promise.all([Society.find(updatedFilter).skip(skip).limit(limit).sort({ societyName: 1 }), Society.countDocuments(updatedFilter)]);

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
    adminContacts: { $in: userId },
    ...applyMandatoryFilter()
  }).select('_id').lean();
};

export const managerSocieties = async (userId) => {
  return await Society.find({
    managerIds: { $in: userId },
    ...applyMandatoryFilter()
  }).select('_id').lean();
};

export const getMySocities = async (userId, withSocietyRoles = false) => {
  const [myContactAdminSocities, myManagerSocities, mySecuritySocities] = await Promise.all([
    contactAdminSocieties(userId),
    managerSocieties(userId),
    SecurityService.getSecuritySocities(userId, withSocietyRoles)
  ]);

  if (!withSocietyRoles) return { socities: [...myContactAdminSocities, ...myManagerSocities] };

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
    if (societiesObj[security.societyId]) societiesObj[security.societyId].push('security');
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
  if (!society) throw new Error('Society not found');

  if (!society.managerIds) society.managerIds = [];
  if (!society.managerIds.some((m) => m.toString() === manager._id.toString())) {
    society.managerIds.push(manager._id);
  }

  await Society.findByIdAndUpdate({ _id: societyId }, society, { new: true });
};

export const deleteSocietyManager = async (societyId, managerId) => {
  const society = await Society.findById(societyId);
  if (!society) throw new Error('Society not found');

  if (!society.managerIds) society.managerIds = [];
  society.managerIds = society.managerIds.filter((m) => m.toString() !== managerId);

  await Society.findByIdAndUpdate({ _id: societyId }, society, { new: true });
};

export const newSocietyAdmin = async (societyId, admin) => {
  const society = await Society.findById(societyId);
  if (!society) throw new Error('Society not found');

  if (!society.adminContacts) society.adminContacts = [];
  if (!society.adminContacts.some((m) => m.toString() === admin._id.toString())) {
    society.adminContacts.push(admin._id);
  }

  await Society.findByIdAndUpdate({ _id: societyId }, society, { new: true });
};

export const deleteSocietyAdmin = async (societyId, adminId) => {
  const society = await Society.findById(societyId);
  if (!society) throw new Error('Society not found');

  if (!society.adminContacts) society.adminContacts = [];
  society.adminContacts = society.adminContacts.filter((m) => m.toString() !== adminId);

  await Society.findByIdAndUpdate({ _id: societyId }, society, { new: true });
};

export const getSocietyManagers = async (societyId) => {
  const society = await Society.findById(societyId)
    .populate('managerIds')
    .select('managerIds');
  return society?.managerIds || [];
};

export const isSocietyAdminOrManager = async (userId, societyId) => {
  const society = await Society.findById(societyId).select('adminContacts managerIds');
  if (!society) return false;

  const userIdStr = userId.toString();
  const isAdmin = society.adminContacts.some(id => id.toString() === userIdStr);
  const isManager = society.managerIds.some(id => id.toString() === userIdStr);
  return isAdmin || isManager;
};