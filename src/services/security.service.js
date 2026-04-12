import { Security } from '../models';

export const addSecurity = (payload) => {
  return Security.create(payload);
};

export const getSecuritySocities = async (userId, withSocietyRoles = false) => {
  return await Security.find({ userId })
};

export const getSocietySecurities = async (societyId, options = {}) => {
  if (!societyId)
    throw new Error('Society Id is needed');

  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const filter = { societyId };

  const [data, total] = await Promise.all([
    Security.find(filter).populate('societyId').populate('userId'),
    Security.countDocuments(filter)
  ])

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
}

export const deleteSocietySecurity = async (securityId) => {
  if (!securityId)
    throw new Error('Security Id is needed');

  return await Security.findOneAndDelete({ userId: securityId });
}


