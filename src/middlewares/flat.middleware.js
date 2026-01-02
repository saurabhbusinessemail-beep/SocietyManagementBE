import { FlatMember } from '../models';

export const isFlatMember = async (req, res, next) => {
  const user = res.locals.user;
  if (user.role === 'admin') return next();

  const flatMemberId = req.params.flatMemberId;
  const member = await FlatMember.findById(flatMemberId);

  if (member.userId.toString() === user._id.toString()) {
    next();
    return;
  }

  return res.status(403).json({
    message: 'Access denied'
  });
};
