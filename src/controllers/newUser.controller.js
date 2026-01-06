import * as AuthService from '../services/auth.service';
import * as newUserService from '../services/newUser.service';
import * as UserService from '../services/user.service';
import * as SecurityService from '../services/security.service';

export const newFlatMember = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let flatMember = req.body;
    // If flat member is not a registered user then add user
    if (!flatMember.userId) {
      const newUser = {
        phoneNumber: flatMember.contact,
        name: flatMember.name
      };
      const user = await UserService.newUser(newUser);
      flatMember.userId = user._id;
    }
    const data = await newUserService.creatFlatMember(flatMember);
    await newUserService.updateFlatMember(flatMember.flatId, flatMember._id);

    const updatedToken = await AuthService.getUserToken(user);
    res.status(201).json({
      success: true,
      message: 'Added Flat Memeber',
      token: updatedToken
    });
  } catch (err) {
    next(err);
  }
};

export const newSecurity = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let payload = req.body;
    payload.userId = user._id;

    SecurityService.addSecurity(payload);

    const updatedToken = await AuthService.getUserToken(user);
    res.status(201).json({
      success: true,
      message: 'Added Security',
      token: updatedToken
    });
  } catch (er) {
    next(err);
  }
};
