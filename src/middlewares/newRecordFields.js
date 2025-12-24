export const newRecordFields = (req, res, next) => {
  const user = res.locals.user;
  if (!user || !user._id) {
    return res.status(403).json({
      message: 'Access denied: no user identified.'
    });
  }

  let payload = req.body;
  payload.createdOn = new Date();
  payload.craetedByUserId = user._id;

  req.body = payload;
  next();
};
