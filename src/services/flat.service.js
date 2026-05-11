import { Flat, FlatMember } from '../models';
import * as UserService from './user.service';
import cacheService from './cache.service';

export const createFlat = (data) => {
  return Flat.create(data);
};

export const bulkCreateFlats = (payload) => {
  return Flat.insertMany(payload);
};

export const getFlatById = async (id) => {
  return await Flat.findById(id).populate('buildingId').populate('societyId').populate('createdByUserId');
};

export const deleteFlat = async (id) => {
  await Flat.findByIdAndDelete(id);
  return '';
};

export const getFlatsBySocietyAndBuilding = async (filter, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Flat.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ floor: 1, flatNumber: 1 })
      .populate('buildingId')
      .populate('societyId')
      .populate('createdByUserId'),
    Flat.countDocuments(filter)
  ]);

  const flatIds = data.map(flat => flat._id);
  const owners = await FlatMember.find({
    flatId: { $in: flatIds },
    isOwner: true,
    status: { $nin: ['expired', 'terminated'] }
  });

  const ownerMap = owners.reduce((acc, owner) => {
    acc[owner.flatId.toString()] = owner._id;
    return acc;
  }, {});

  const updatedData = data.map(flat => {
    const flatObj = flat.toObject();
    if (ownerMap[flat._id.toString()]) {
      flatObj.flatOwnerMemberId = ownerMap[flat._id.toString()];
    }
    return flatObj;
  });

  return {
    data: updatedData,
    total,
    page,
    limit,
    success: true
  };
};

export const getFlatsCountBySocietyAndBuilding = async (filter) => {
  const count = await Flat.countDocuments(filter);

  return {
    data: count,
    success: true
  };
};

// Flat Members
export const myFlats = async (userId, societyId = null, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  let filter = { userId: userId, status: { $nin: ['expired', 'terminated'] } };
  if (societyId) {
    filter = { ...filter, societyId };
  }
  const [data, total] = await Promise.all([
    FlatMember.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ floor: 1, flatNumber: 1 })
      .populate('societyId')
      .populate('userId')
      .populate('createdByUserId')
      .populate({
        path: 'flatId',
        populate: {
          path: 'buildingId',
          model: 'Building'
        }
      }),

    FlatMember.countDocuments(filter)
  ]);

  const flatIds = data.map(member => member.flatId?._id).filter(id => id);

  const [tenants, owners] = await Promise.all([
    FlatMember.find({ flatId: { $in: flatIds }, isTenant: true, status: { $nin: ['expired', 'terminated'] } }).populate('userId'),
    FlatMember.find({ flatId: { $in: flatIds }, isOwner: true, status: { $nin: ['expired', 'terminated'] } }).populate('userId')
  ]);

  const tenantMap = tenants.reduce((acc, tenant) => {
    const fid = tenant.flatId.toString();
    if (!acc[fid]) acc[fid] = [];
    acc[fid].push(tenant);
    return acc;
  }, {});

  const ownerMap = owners.reduce((acc, owner) => {
    acc[owner.flatId.toString()] = owner;
    return acc;
  }, {});

  const updatedData = data.map(member => {
    const memberObj = member.toObject();
    // Use residingType from flatId
    const residingType = memberObj.flatId?.residingType || 'Vacant';
    memberObj.residingType = residingType;

    if (residingType === 'Tenant') {
      const flatTenants = tenantMap[memberObj.flatId._id.toString()] || [];
      memberObj.tenants = flatTenants;
      memberObj.tenant = flatTenants.length > 0 ? flatTenants[0] : undefined;
    }
    if (!memberObj.isOwner) {
      memberObj.owner = ownerMap[memberObj.flatId._id.toString()];
    }
    return memberObj;
  });

  return {
    data: updatedData,
    total,
    page,
    limit,
    success: true
  };
};

export const getFlatOwner = async (flatId) => {
  return FlatMember.findOne({ flatId, isOwner: true, status: { $nin: ['expired', 'terminated'] } }).populate('userId');
}

export const getFlatTenant = async (flatId) => {
  return FlatMember.findOne({ flatId, isTenant: true, status: { $nin: ['expired', 'terminated'] } }).populate('userId');
}

export const canAddDirectly = async (requester, memberData) => {
  const { flatId, isOwner, isTenant, isMember, isTenantMember } = memberData;

  // Adding an owner always requires society admin approval → cannot add directly
  if (isOwner) return false;

  const flatOwner = await getFlatOwner(flatId);
  const flatTenant = await getFlatTenant(flatId);

  const isRequesterOwner = flatOwner && flatOwner.userId._id.toString() === requester._id.toString();
  const isRequesterTenant = flatTenant && flatTenant.userId._id.toString() === requester._id.toString();

  // Adding a tenant → only owner can add directly
  if (isTenant) return isRequesterOwner;

  // Adding a member → only owner can add directly
  if (isMember) return isRequesterOwner;

  // Adding a tenant member → owner or tenant can add directly
  if (isTenantMember) return isRequesterOwner || isRequesterTenant;

  return false;
};


export const myFlatIds = async (userId, societyId = null) => {
  let filter = { userId: { $in: userId }, status: { $nin: ['expired', 'terminated'] } };
  if (societyId) {
    filter = { ...filter, societyId };
  }

  return await FlatMember.find(filter);
}

export const myTenants = async (userId, societyId = null, flatId = null, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  const myFlatMemberRecords = await FlatMember.find({ userId, isOwner: true, status: { $nin: ['expired', 'terminated'] } });
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
      .sort({ createdOn: -1 })
      .populate('societyId')
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
  const myFlatMemberRecords = await FlatMember.find({ userId, status: { $nin: ['expired', 'terminated'] } });
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
  const fm = await FlatMember.findById(flatMemberId)
    .populate('societyId')
    .populate('userId')
    .populate('createdByUserId')
    .populate({
      path: 'flatId',
      populate: {
        path: 'buildingId',
        model: 'Building'
      }
    });

  if (!fm) return null;

  const fmObj = fm.toObject();
  // Use residingType from flatId
  fmObj.residingType = fmObj.flatId?.residingType || 'Vacant';

  if (fmObj.residingType === 'Tenant') {
    const tenant = await getFlatTenant(fmObj.flatId._id);
    fmObj.tenant = tenant;
  }
  if (!fmObj.isOwner) {
    const owner = await getFlatOwner(fmObj.flatId._id);
    fmObj.owner = owner;
  }

  return fmObj;
};

export const memberFlats = async (userId, withSocietyRoles = false) => {
  const flats = await FlatMember.find({
    userId: { $in: userId },
    status: { $nin: ['expired', 'terminated'] }
  }).select('societyId flatId isOwner isTenant').lean();
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
  let filter = { flatId, status: { $nin: ['expired', 'terminated'] } };
  if (userId) filter.userId = userId;

  return FlatMember.find(filter)
    .populate('societyId')
    .populate('userId')
    .populate('createdByUserId')
    .populate({
      path: 'flatId',
      populate: {
        path: 'buildingId',
        model: 'Building'
      }
    });
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

export const moveOutTenant = async (flatMemberId, moveOutDate, modifiedByUserId) => {
  if (!flatMemberId || !moveOutDate || !modifiedByUserId) {
    throw new Error('Missing required parameters: flatMemberId, moveOutDate, modifiedByUserId');
  }

  // 1. Find the target flat member (the tenant moving out)
  const targetMember = await FlatMember.findById(flatMemberId);
  const modifiedByMember = await FlatMember.findOne({ userId: modifiedByUserId, flatId: targetMember.flatId, status: { $nin: ['expired', 'terminated'] } });
  if (!modifiedByMember) {
    throw new Error('You are not a flat member.');
  }
  if (!modifiedByMember.isOwner) {
    throw new Error('You do not have permission to move out a tenant.');
  }
  if (!targetMember) {
    throw new Error('FlatMember not found');
  }
  if (targetMember.isDeleted) {
    throw new Error('FlatMember is already deleted');
  }
  const flatId = targetMember.flatId;
  const flat = await Flat.findById(flatId);

  if (!flat) {
    throw new Error('Flat not found');
  }

  if (flat.residingType !== 'Tenant') {
    throw new Error('The flat is not currently occupied by tenants.');
  }

  const now = new Date();

  // If the owner requested move-out (passing their own ID), move out all active tenants
  if (targetMember.isOwner) {
    const activeTenants = await FlatMember.find({
      flatId: flatId,
      isTenant: true,
      status: { $nin: ['expired', 'terminated'] }
    });

    for (const tenant of activeTenants) {
      await FlatMember.findByIdAndUpdate(tenant._id, {
        $set: {
          leaseEnd: moveOutDate,
          status: 'expired',
          modifiedOn: now,
          modifiedByUserId: modifiedByUserId
        }
      });
    }
  } else {
    // A specific tenant is moving out
    if (!targetMember.isTenant) {
      throw new Error('The specified FlatMember is not a tenant');
    }
    await FlatMember.findByIdAndUpdate(flatMemberId, {
      $set: {
        leaseEnd: moveOutDate,
        status: 'expired',
        modifiedOn: now,
        modifiedByUserId: modifiedByUserId
      }
    });
  }

  // Vacancy Check: Determine if the flat should now be marked as Vacant
  let isGoingToBeVacant = false;
  if (flat.isMultiTenantAllowed) {
    const remainingTenantsCount = await FlatMember.countDocuments({
      flatId: flatId,
      isTenant: true,
      status: { $nin: ['expired', 'terminated'] }
    });
    if (remainingTenantsCount === 0) isGoingToBeVacant = true;
  } else {
    isGoingToBeVacant = true;
  }

  if (isGoingToBeVacant) {
    await Flat.findByIdAndUpdate(flatId, {
      $set: {
        residingType: 'Vacant',
        modifiedOn: now,
        modifiedByUserId: modifiedByUserId
      }
    });

    // Expire all active non-owner members (Tenant Members, etc.)
    await FlatMember.updateMany(
      {
        flatId: flatId,
        isOwner: false,
        status: { $nin: ['expired', 'terminated'] }
      },
      {
        $set: {
          modifiedOn: now,
          modifiedByUserId: modifiedByUserId,
          status: 'expired'
        }
      }
    );
  }

  // Clear cache for all tenants and tenant members of this flat
  const expiredMembers = await FlatMember.find({
    flatId: flatId,
    isOwner: false,
    $or: [{ isTenant: true }, { isTenantMember: true }]
  });
  expiredMembers.forEach((m) => cacheService.invalidate(m.userId.toString()));

  // Return some useful info (e.g., updated counts)
  return {
    success: true,
    message: 'Tenant moved out successfully'
  };
};

export const moveOutOwner = async (flatMemberId, modifiedByUserId) => {
  const targetMember = await FlatMember.findById(flatMemberId);
  const modifiedByMember = await FlatMember.findOne({ userId: modifiedByUserId, flatId: targetMember.flatId, status: { $nin: ['expired', 'terminated'] } });
  if (!modifiedByMember) {
    throw new Error('You are not a flat member.');
  }
  if (!modifiedByMember.isOwner) {
    throw new Error('You do not have permission to move out a tenant.');
  }
  if (!targetMember) {
    throw new Error('FlatMember not found');
  }
  if (targetMember.isDeleted) {
    throw new Error('FlatMember is already deleted');
  }
  const flatId = targetMember.flatId;
  const flat = await Flat.findById(flatId);

  if (!flat) {
    throw new Error('Flat not found');
  }

  if (flat.residingType !== 'Self') {
    throw new Error('The specified FlatMember is not residing currently');
  }

  const now = new Date();

  // Update residing type to Vacant for the Flat
  await Flat.findByIdAndUpdate(flatId, {
    $set: {
      residingType: 'Vacant',
      modifiedOn: now,
      modifiedByUserId: modifiedByUserId
    }
  });

  // expire all the current flat members except owners
  await FlatMember.updateMany(
    {
      flatId: flatId,
      isOwner: false // exclude owners
    },
    {
      $set: {
        status: 'expired'
      }
    }
  );

  // Clear cache for the owner (logged in user)
  cacheService.invalidate(modifiedByUserId.toString());

  const data = await FlatMember.findById(flatMemberId);
  return {
    success: true,
    message: 'You moved out successfully',
    data
  };
};

export const moveInSelf = async (flatMemberId, modifiedByUserId, moveOutDate = new Date()) => {
  if (!flatMemberId || !modifiedByUserId) {
    throw new Error('Missing required parameters: flatMemberId, modifiedByUserId');
  }

  const targetMember = await FlatMember.findById(flatMemberId);
  const modifiedByMember = await FlatMember.findOne({ userId: modifiedByUserId, flatId: targetMember.flatId, status: { $nin: ['expired', 'terminated'] } });
  if (!modifiedByMember) {
    throw new Error('You are not a flat member.');
  }
  if (!modifiedByMember.isOwner) {
    throw new Error('You do not have permission to move out a tenant.');
  }
  if (!targetMember) {
    throw new Error('FlatMember not found');
  }
  if (targetMember.isDeleted) {
    throw new Error('Target FlatMember is deleted; cannot perform move‑in');
  }

  const flatId = targetMember.flatId;
  const now = new Date();

  const flat = await Flat.findById(flatId);
  if (!flat) {
    throw new Error('Flat not found');
  }

  if (flat.residingType === 'Tenant') {
    const activeTenants = await FlatMember.find({
      flatId: flatId,
      isTenant: true,
      status: { $nin: ['expired', 'terminated'] }
    });

    for (const tenant of activeTenants) {
      await moveOutTenant(tenant._id, moveOutDate, modifiedByUserId);
    }
  }

  await Flat.findByIdAndUpdate(flatId, {
    $set: {
      residingType: 'Self',
      modifiedOn: now,
      modifiedByUserId: modifiedByUserId
    }
  });

  await FlatMember.updateMany(
    { flatId: flatId, isMember: true },
    {
      $set: {
        status: 'active'
      }
    }
  );

  // Clear cache for the owner (logged in user)
  cacheService.invalidate(modifiedByUserId.toString());

  const data = await FlatMember.findById(flatMemberId);
  return {
    success: true,
    message: 'Move‑in self completed successfully',
    data
  };
};

export const moveInTenant = async (flatMemberId, modifiedByUserId, moveInDate) => {

  const targetMember = await FlatMember.findById(flatMemberId);
  const modifiedByMember = await FlatMember.findOne({ userId: modifiedByUserId, flatId: targetMember.flatId, status: { $nin: ['expired', 'terminated'] } });

  if (!modifiedByMember) {
    throw new Error('You are not a flat member.');
  }
  if (!modifiedByMember.isOwner) {
    throw new Error('You do not have permission to move out a tenant.');
  }
  if (!targetMember) {
    throw new Error('FlatMember not found');
  }
  if (targetMember.isDeleted) {
    throw new Error('Target FlatMember is deleted; cannot perform move‑in');
  }

  const flatId = targetMember.flatId;
  const now = new Date();

  // Date
  const today = new Date();
  const startDate = (targetMember.leaseStart ? new Date(targetMember.leaseStart) : today);
  startDate.setHours(0, 0, 0, 0);
  const isUpComingTenant = today < startDate;
  const updatedStartDate = isUpComingTenant ? today : startDate;

  const flat = await Flat.findById(flatId);

  if (!flat) {
    throw new Error('Flat not found');
  }

  const currentResidingType = flat.residingType || 'Vacant';

  if (currentResidingType === 'Self') {
    // 1. Check for an owner residing as Self
    const ownerSelf = await FlatMember.findOne({
      flatId,
      isOwner: true,
      status: { $nin: ['expired', 'terminated'] }
    });

    if (ownerSelf) {
      await moveOutOwner(ownerSelf._id, modifiedByUserId);
    }
  }

  if (currentResidingType === 'Tenant' && !flat.isMultiTenantAllowed) {
    // 2. Check for any active tenant
    const activeTenant = await FlatMember.findOne({
      flatId,
      isTenant: true,
      status: { $nin: ['expired', 'terminated'] },
      _id: { $ne: flatMemberId }
    });

    if (activeTenant) {
      await moveOutTenant(activeTenant._id, moveInDate, modifiedByUserId);
    }
  }

  // 3. Update residing type to Tenant on Flat
  await Flat.findByIdAndUpdate(flatId, {
    $set: {
      residingType: 'Tenant',
      modifiedOn: now,
      modifiedByUserId: modifiedByUserId
    }
  });

  // Update leaseStart for members if needed (though it was being set on all members before, 
  // maybe we should only set it on the specific tenant member or keep it if it's shared logic.
  // The previous code set leaseStart on ALL members of the flat, which seems wrong but I'll stick to logic).
  // Actually, leaseStart should probably be on the FlatMember.
  await FlatMember.updateMany(
    { flatId: flatId },
    {
      $set: {
        modifiedOn: now,
        modifiedByUserId: modifiedByUserId,
        leaseStart: updatedStartDate
      }
    }
  );

  // await update current flat member as active
  const updatedMember = await FlatMember.findByIdAndUpdate(flatMemberId, {
    $set: {
      status: 'active'
    }
  }, { new: true });

  // Clear cache for tenant and tenant members of this flat
  const tenantAndTenantMembers = await FlatMember.find({
    flatId: flatId,
    $or: [{ isTenant: true }, { isTenantMember: true }],
    status: { $nin: ['expired', 'terminated'] }
  });
  tenantAndTenantMembers.forEach((m) => cacheService.invalidate(m.userId.toString()));
};

export const getCurrentResidingType = async (flatId) => {
  const flat = await Flat.findById(flatId);
  return flat?.residingType || 'Vacant';
};

export const deleteFlatMember = async (id) => {
  await FlatMember.findByIdAndDelete(id);
  return '';
};

export const updateFlat = async (id, data, modifiedByUserId) => {
  const flat = await Flat.findById(id);
  if (!flat) throw new Error('Flat not found');

  const oldMultiTenant = flat.isMultiTenantAllowed;
  const newMultiTenant = data.isMultiTenantAllowed;

  const result = await Flat.findByIdAndUpdate(id, data, { new: true });

  if (newMultiTenant !== undefined && oldMultiTenant !== newMultiTenant) {
    // If setting changed, move out all tenants
    const ownerMember = await FlatMember.findOne({ flatId: id, isOwner: true, status: { $nin: ['expired', 'terminated'] } });
    if (ownerMember) {
      await moveOutTenant(ownerMember._id, new Date(), modifiedByUserId);
    }
  }

  return result;
};
