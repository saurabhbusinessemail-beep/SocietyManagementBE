export const checkPermissions = (
  requiredPermissions = [],
  withSocietyId = false
) => {
  return async (req, res, next) => {
    const user = res.locals.user;
    if (user.role === 'admin') return next();

    const id = req.params.id;

    const socities = res.locals.socities ?? [];
    const allowedSocities = socities.filter(
      (s) =>
        (!withSocietyId || s.societyId === id) &&
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

  const allowedSocityIds = res.locals.allowedSocityIds ?? (res.locals.socities ?? []).map(s => s.societyId);
  const filter = allowedSocityIds ? { _id: { $in: allowedSocityIds } } : {};

  res.locals.filter = filter;
  next();
};
