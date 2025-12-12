import Joi from '@hapi/joi';

export const newUserValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().allow(null, ""),
    email: Joi.string().email().allow(null, ""),
    phoneNumber: Joi.string().required(),
    status: Joi.string().valid("active", "inactive", "pending", "blocked"),
    profilePic: Joi.string().allow(null, ""),
  
    societyId: Joi.string().allow(null, ""),
    buildingId: Joi.string().allow(null, ""),
    flatId: Joi.string().allow(null, ""),
  
    role: Joi.string().valid("admin", "manager", "owner", "tenant", "security"),
  
    meta: Joi.any()
  });
  const { error, value } = schema.validate(req.body);
  console.log({ error, value })
  if (error) {
    next(error);
  } else {
    req.validatedBody = value;
    next();
  }
};
