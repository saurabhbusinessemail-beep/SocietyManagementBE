import { Flat, FlatMember } from '../models';

export const createFlat = (data) => {
  return Flat.create(data);
};

export const bulkCreateFlats = (payload) => {
  return Flat.insertMany(payload);
};

export const deleteFlat = async (id) => {
  await Flat.findByIdAndDelete(id);
  return '';
};

export const getFlatsBySocietyAndBuilding = async (filter, options = {}) => {
  const { page = 1, limit = 500 } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Flat.find(filter).skip(skip).limit(limit).sort({ floor: 1, flatNumber: 1 }),
    Flat.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const myFlats = async (userId, societyId = null) => {
  let filter = { userId: { $in: userId } };
  if (societyId) {
    filter = { ...filter, societyId };
  }
  return await FlatMember.find(filter)
    .populate('societyId')
    .populate('flatId')
    .populate('userId')
    .populate({
      path: 'flatId',
      populate: {
        path: 'buildingId',
        model: 'Building'
      }
    });
};

export const flatMember = async (flatMemberId) => {
  return await FlatMember.findById(flatMemberId)
    .populate('societyId')
    .populate('flatId')
    .populate('userId');
};

export const memberFlats = async (userId, withSocietyRoles = false) => {
  const flats = await FlatMember.find({
    userId: { $in: userId }
  });
  if (!flats) return;

  const myOwnerFlatMemberRecords = flats.filter((f) => f.isOwner);
  const myTenantFlatMemberRecords = flats.filter((f) => f.isTenant);
  const myMemberFlatMemberRecords = flats.filter(
    (f) => !f.isOwner && !f.isTenant
  );

  if (!withSocietyRoles) {
    return {
      socities: [
        ...myOwnerFlatMemberRecords,
        ...myTenantFlatMemberRecords,
        ...myMemberFlatMemberRecords
      ]
    };
  }

  let flatsObj = {};
  myOwnerFlatMemberRecords.forEach((flatMember) => {
    if (flatsObj[flatMember.societyId])
      flatsObj[flatMember.societyId].push('owner');
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
