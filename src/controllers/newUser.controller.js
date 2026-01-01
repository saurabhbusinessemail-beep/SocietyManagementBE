import * as AuthService from '../services/auth.service';
import * as newUserService from '../services/newUser.service';


export const createFlatMember = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    let flatMember = req.body;
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
