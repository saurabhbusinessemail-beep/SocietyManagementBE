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

export const myFlatMembers = async (userId, societyId = null, flatId = null, userSocieties = [], options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  // First, get all societies where user has roles
  const societyIds = userSocieties.map((s) => s.societyId.toString());

  // If societyId filter is provided, verify user has access to that society
  if (societyId && !societyIds.includes(societyId.toString())) {
    return {
      data: [],
      total: 0,
      page,
      limit,
      success: false,
      message: "You don't have access to this society"
    };
  }

  // Get user's flat membership records
  const myFlatMemberRecords = await FlatMember.find({ userId });
  const myFlats = myFlatMemberRecords.map((fm) => fm.flatId);

  // Build the base filter
  let filter = {};

  // Apply society filter if provided
  if (societyId) {
    filter.societyId = societyId;
  } else {
    // Filter by societies user has access to
    filter.societyId = { $in: societyIds };
  }

  // Apply flat filter if provided
  if (flatId) {
    filter.flatId = flatId;

    // Verify user has access to this flat
    if (!myFlats.includes(flatId)) {
      // Check if user has owner permissions in this society
      const userSociety = userSocieties.find((s) => s.societyId.toString() === (societyId || myFlatMemberRecords.find((fm) => fm.flatId.toString() === flatId.toString())?.societyId?.toString()));

      if (!userSociety) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          success: false,
          message: "You don't have access to this flat"
        };
      }
    }
  } else {
    // If no flatId filter, show flats user has access to
    filter.flatId = { $in: myFlats };
  }

  // Determine user's role in each flat they belong to
  const userFlatRoles = {};
  myFlatMemberRecords.forEach((fm) => {
    const flatIdStr = fm.flatId.toString();
    userFlatRoles[flatIdStr] = {
      isOwner: fm.isOwner,
      isTenant: fm.isTenant,
      societyId: fm.societyId
    };
  });

  // Build permission-based filters
  let permissionFilter = [];

  // For each flat, apply appropriate visibility rules
  const flatIdsToFilter = flatId ? [flatId] : myFlats;

  for (const flatIdStr of flatIdsToFilter) {
    const userRole = userFlatRoles[flatIdStr];

    if (userRole) {
      if (userRole.isOwner) {
        // Owners can see all members (both isMember and isTenantMember)
        permissionFilter.push({
          flatId: flatIdStr,
          $or: [{ isMember: true }, { isTenantMember: true }]
        });
      } else if (userRole.isTenant) {
        // Tenants can only see tenant members
        permissionFilter.push({
          flatId: flatIdStr,
          isTenantMember: true
        });
      }
    } else {
      // User doesn't have direct membership in this flat
      // Check if they have owner permissions in the society
      // const society = userSocieties.find((s) => s.societyId.toString() === (societyId || userRole?.societyId?.toString()));
      // if (society) {
      //   const hasOwnerPermissions = society.societyRoles.some((role) => role.permissions.includes('owner.view'));
      //   if (hasOwnerPermissions) {
      //     // User with owner.view permission can see all members
      //     permissionFilter.push({
      //       flatId: flatIdStr,
      //       $or: [{ isMember: true }, { isTenantMember: true }]
      //     });
      //   }
      // }
    }
  }

  // If no permission filters were added, return empty
  if (permissionFilter.length === 0) {
    return {
      data: [],
      total: 0,
      page,
      limit,
      success: true
    };
  }

  // Combine filters
  if (permissionFilter.length > 0) {
    filter.$or = permissionFilter;
  }

  // Execute query
  const [data, total] = await Promise.all([
    FlatMember.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ 'flatId.floor': 1, 'flatId.flatNumber': 1 })
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
