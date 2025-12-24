import { Flat, FlatMember } from '../models';

export const createFlat = (data) => {
  return Flat.create({
    ...data,
    societyId: data.societyId,
    buildingId: data.buildingId || null
  });
};

export const bulkCreateFlats = ({ societyId, buildingId, flats }) => {
  return Flat.insertMany(
    flats.map((f) => ({
      ...f,
      societyId,
      buildingId: buildingId || null
    }))
  );
};

export const getFlats = ({ societyId, buildingId }) => {
  let filter = { societyId };
  if (buildingId) filter['buildingId'] = buildingId;
  return Flat.find(filter);
};

export const myFlats = async (userId, withSocietyRoles = false) => {
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
