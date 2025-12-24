import * as userUtils from '../utils/user.util';

export const attachSociety = async (req, res, next) => {
  const user = res.locals.user;

  if (!user || !user._id || !user.role) {
    return res.status(401).json({
      message: 'Unauthorized: user context missing'
    });
  }

  const { socities, roles } = await userUtils.userSocitiesWithRole(user._id);
  res.locals.socities = socities;

  next();
};

export const checkPermissions = (
  requiredPermissions = [],
  withId = undefined
) => {
  return async (req, res, next) => {
    const user = res.locals.user;
    if (user.role === 'admin') return next();

    const id = req.params.id;

    const socities = res.locals.socities ?? [];
    const allowedSocities = socities.filter(
      (s) =>
        (!withId || s[withId] === id) &&
        s.societyRoles.some((sr) =>
          sr.permissions.some((p) => requiredPermissions.includes(p))
        )
    );

    if (allowedSocities.length === 0) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    res.locals.allowedSocityIds = allowedSocities.map((s) => s.societyId);
    next();
  };
};

export const createSocietyFilter = async (req, res, next) => {
  const user = res.locals.user;
  if (user.role === 'admin') return next();

  const allowedSocityIds = res.locals.allowedSocityIds ?? [];
  const filter = allowedSocityIds ? { _id: { $in: allowedSocityIds } } : {};

  res.locals.filter = filter;
  next();
};
