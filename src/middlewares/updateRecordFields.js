export const updateRecordFields = (req, res, next) => {
    const user = res.locals.user;
    if (!user || !user._id) {
      return res.status(403).json({
        message: 'Access denied: no user identified.'
      });
    }
  
    let payload = req.body;
    payload.modifiedOn = new Date();
    payload.modifiedByUserId = user._id;
  
    req.body = payload;
    next();
  };
  