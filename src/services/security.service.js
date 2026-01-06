import { Security } from '../models';

export const addSecurity = (payload) => {
  return Security.create(payload);
};

export const getSecuritySocities = async (userId, withSocietyRoles = false) => {
    return await Security.find({userId})
};
