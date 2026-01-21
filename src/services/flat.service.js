import { Flat, FlatMember } from '../models';
import * as UserService from './user.service';

export const createFlat = (data) => {
  return Flat.create(data);
};

export const bulkCreateFlats = (payload) => {
  return Flat.insertMany(payload);
};

export const getFlatById = async (id) => {
  return await Flat.findById(id);
};

export const deleteFlat = async (id) => {
  await Flat.findByIdAndDelete(id);
  return '';
};

export const getFlatsBySocietyAndBuilding = async (filter, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([Flat.find(filter).skip(skip).limit(limit).sort({ floor: 1, flatNumber: 1 }).populate('buildingId').populate('societyId'), Flat.countDocuments(filter)]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

// Flat Members
export const myFlats = async (userId, societyId = null, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  let filter = { userId: { $in: userId } };
  if (societyId) {
    filter = { ...filter, societyId };
  }
  const [data, total] = await Promise.all([
    FlatMember.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ floor: 1, flatNumber: 1 })
      .populate('societyId')
      .populate('flatId')
      .populate('userId')
      .populate({
        path: 'flatId',
        populate: {
          path: 'buildingId',
          model: 'Building'
        }
      }),

    FlatMember.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const myTenants = async (userId, societyId = null, flatId = null, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  const myFlatMemberRecords = await FlatMember.find({ userId, isOwner: true });
  const myFlats = myFlatMemberRecords.map((fm) => fm.flatId);

  let filter = { isTenant: true, flatId: { $in: myFlats } };
  if (societyId) {
    filter = { ...filter, societyId };
  }
  if (flatId) {
    filter = { ...filter, flatId };
  }
  const [data, total] = await Promise.all([
    FlatMember.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ floor: 1, flatNumber: 1 })
      .populate('societyId')
      .populate('flatId')
      .populate('userId')
      .populate({
        path: 'flatId',
        populate: {
          path: 'buildingId',
          model: 'Building'
        }
      }),

    FlatMember.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const flatMember = async (flatMemberId) => {
  return await FlatMember.findById(flatMemberId).populate('societyId').populate('flatId').populate('userId');
};

export const memberFlats = async (userId, withSocietyRoles = false) => {
  const flats = await FlatMember.find({
    userId: { $in: userId }
  });
  if (!flats) return;

  const myOwnerFlatMemberRecords = flats.filter((f) => f.isOwner);
  const myTenantFlatMemberRecords = flats.filter((f) => f.isTenant);
  const myMemberFlatMemberRecords = flats.filter((f) => !f.isOwner && !f.isTenant);

  if (!withSocietyRoles) {
    return {
      socities: [...myOwnerFlatMemberRecords, ...myTenantFlatMemberRecords, ...myMemberFlatMemberRecords]
    };
  }

  let flatsObj = {};
  myOwnerFlatMemberRecords.forEach((flatMember) => {
    if (flatsObj[flatMember.societyId]) flatsObj[flatMember.societyId].push('owner');
    else flatsObj[flatMember.societyId] = ['owner'];
  });
  myTenantFlatMemberRecords.forEach((tenant) => {
    if (flatsObj[tenant.societyId]) flatsObj[tenant.societyId].push('tenant');
    else flatsObj[tenant.societyId] = ['tenant'];
  });
  myMemberFlatMemberRecords.forEach((member) => {
    if (flatsObj[member.societyId]) flatsObj[member.societyId].push('member');
    else flatsObj[member.societyId] = ['member'];
  });

  let rolesObj = new Set();
  let socities = [];
  for (let key of Object.keys(flatsObj)) {
    const societyId = key;
    const roles = flatsObj[key];
    roles.forEach((role) => rolesObj.add(role));
    socities.push({ societyId, societyRoles: roles });
  }
  const roles = [...rolesObj.values()];

  return { socities, roles };
};

export const getFlatMembersByFlatId = (flatId, userId = undefined) => {
  let filter = { flatId };
  if (userId) filter.userId = userId;

  return FlatMember.find(filter).populate('societyId').populate('flatId').populate('userId');
};

export const loopThroughGateEntryFlatMembers = async (gateEntry, fromUser, callBack, includeSecurity = false) => {
  const flatMembers = await getFlatMembersByFlatId(gateEntry.flatId);
  const arrNotificationPromises = [];

  for (let i = 0; i < flatMembers.length; i++) {
    const toUserId = flatMembers[i].userId;
    if (toUserId === fromUser._id) continue;

    const user = await UserService.getUser(toUserId);
    if (!user || !user.fcmToken) continue;

    arrNotificationPromises.push(callBack(toUserId, user));
  }

  if (includeSecurity && gateEntry.createdByUserId !== fromUser._id) {
    console.log('sending notification to security ', gateEntry.createdByUserId);
    const user = await UserService.getUser(gateEntry.createdByUserId);
    arrNotificationPromises.push(callBack(gateEntry.createdByUserId, user));
  }

  if (arrNotificationPromises.length > 0) await Promise.all(arrNotificationPromises);
  else return new Error('No flat member found');
};

export const updatedeleteFlatMemberLeaseEnd = async (id, dt, userId) => {
  return await FlatMember.findByIdAndUpdate(
    id,
    {
      $set: {
        leaseEnd: new Date(dt),
        modifiedOn: new Date(),
        modifiedByUserId: userId
      }
    },
    { new: true }
  );
};

export const deleteFlatMember = async (id) => {
  await FlatMember.findByIdAndDelete(id);
  return '';
};
