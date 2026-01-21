import { GatePass } from '../models';
import { getISTDayRange } from '../utils/other.util';

export const createGatePass = (data) => {
  return GatePass.create({
    ...data,
    societyId: data.societyId
  });
};

export const getGatePasses = async (filter, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    GatePass.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdOn: -1 })
      .populate('societyId')
      .populate('flatId')
      .populate('userId'),
    GatePass.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const gettGatePass = async (id) => {
  const data = await GatePass.findById(id)
    .populate('societyId')
    .populate('flatId')
    .populate('userId');
  return data;
};

export const updateGatePass = async (_id, body) => {
  const data = await GatePass.findByIdAndUpdate({ _id }, body, { new: true });
  return data;
};

export const deleteGatePass = async (id) => {
  await GatePass.findByIdAndDelete(id);
  return '';
};

export const validateOTP = async (otp, societyId, flatId) => {
  const { start, end } = getISTDayRange();
  let filter = {
    societyId,
    otp: otp * 1,
    expectedDate: {
      $gte: new Date(start),
      $lt: new Date(end)
    }
  };
  if (flatId) filter.flatId = flatId;

  return await GatePass.find(filter)
    .populate('societyId')
    .populate('flatId')
    .populate('userId');
};

export const validateGatePass = async (gatePassId) => {
  return await GatePass.findById(gatePassId)
    .populate('societyId')
    .populate('flatId')
    .populate('userId');
};
