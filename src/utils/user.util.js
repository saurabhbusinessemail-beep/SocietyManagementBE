import * as SocietyService from '../services/society.service';
import * as FlatService from '../services/flat.service';
import { SocietyRole } from '../models';

export const areSameContacts = (contact1, contact2) => {};

export const userSocitiesWithRole = async (userId) => {
  try {
    const r = await SocietyService.getMySocities(userId, true);
    const { socities: socitiesBySociety, roles: rolesBySociety } =
      await SocietyService.getMySocities(userId, true);

    const { socities: socitiesByFlat, roles: rolesByFlat } =
      await FlatService.memberFlats(userId, true);

    const rolesFromDB = await SocietyRole.find({
      name: { $in: [...rolesBySociety, ...rolesByFlat] }
    });


    // Update roles in all socities
    const roleMap = new Map(rolesFromDB.map((r) => [r.name, r]));
    const societiesMap = new Map();
    [...socitiesBySociety, ...socitiesByFlat].forEach(
      ({ societyId, societyRoles }) => {
        if (!societiesMap.has(societyId)) {
          societiesMap.set(societyId, new Set());
        }
        societyRoles.forEach((r) => {
          const roles = societiesMap.get(societyId);
          if (roles) {
            const rm = roleMap.get(r);
            roles.add(rm);
          }
        });
      }
    );

    //Calculate final socities
    const socities = Array.from(societiesMap.entries()).map(
      ([societyId, societyRoles]) => ({
        societyId,
        societyRoles: [...societyRoles.values()]
      })
    );

    const roles = [...new Set([...rolesBySociety, ...rolesByFlat]).values()];

    return { socities, roles };
  } catch (err) {
    console.log('Error ', err);
    return { socities: [], roles: [] };
  }
};
