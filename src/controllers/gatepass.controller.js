const gatePassService = require('../services/gatepass.service');
const userService = require('../services/user.service');
const flatService = require('../services/flat.service');

export const createGatePass = async (req, res, next) => {
  try {
    let gatePass = req.body;

    // if user id is not sent as string rather sent as an object having name and phoneNumber then search or create user and update the userId
    if (typeof gatePass.userId !== 'string') {
      const users = await userService.searchUsers(gatePass.userId.phoneNumber);
      if (users.data.length > 0) {
        gatePass.userId = users.data[0]._id;
      } else {
        const user = await userService.newUser(payload);
        gatePass.userId = user._id;
      }
    }

    gatePass.otp = Math.floor(100000 + Math.random() * 900000).toString();

    const data = await gatePassService.createGatePass(gatePass);
    res.status(201).json({ data, success: true });
  } catch (err) {
    next(err);
  }
};

export const getGatePasses = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.json({ success: false, message: 'No user found' });
    }

    const { societyId, flatId } = req.body;
    let filter = {};
    if (societyId) filter.societyId = societyId;
    if (flatId) filter.flatId = flatId;

    if (!flatId) {
      const myFlatMemberRecords = (
        await flatService.myFlats(user._id, societyId)
      ).data;

      const flatIds = myFlatMemberRecords.map((fm) => fm.flatId._id);
      if (flatIds && flatIds.length > 0) {
        filter.flatId = { $in: flatIds };
      }
    }

    const { page, limit } = req.query;
    const data = await gatePassService.getGatePasses(filter, {
      page: Number(page),
      limit: Number(limit)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getGatePass = async (req, res, next) => {
  try {
    const data = await gatePassService.gettGatePass(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateGatePass = async (req, res, next) => {
  try {
    let gatePass = req.body;
    const data = await gatePassService.updateGatePass(req.params.id, gatePass);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteGatePass = async (req, res, next) => {
  try {
    const data = await gatePassService.deleteGatePass(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
