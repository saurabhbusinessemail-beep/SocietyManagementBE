import { GatePass } from '../models';
import { getISTDayRange } from '../utils/other.util';
import { checkFeatureAccess } from './planCache.service';
import { FEATURES } from '../config/features';

export const createGatePass = async (data) => {
  // Check feature access
  const featureCheck = await checkFeatureAccess(data.societyId, FEATURES.SMART_GATE_PASS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return GatePass.create({
    ...data,
    societyId: data.societyId
  });
};

export const getGatePasses = async (filter, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // If societyId is in filter, check feature access
  if (filter.societyId) {
    const featureCheck = await checkFeatureAccess(filter.societyId, FEATURES.SMART_GATE_PASS);
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason);
    }
  }

  const [data, total] = await Promise.all([
    GatePass.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdOn: -1 })
      .populate('societyId')
      .populate('flatId')
      .populate('userId')
      .populate('createdByUserId'),
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

export const getGatePass = async (id) => {
  const gatePass = await GatePass.findById(id)
    .populate('societyId')
    .populate('flatId')
    .populate('userId')
    .populate('createdByUserId');

  if (!gatePass) {
    throw new Error('Gate pass not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gatePass.societyId, FEATURES.SMART_GATE_PASS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return gatePass;
};

export const updateGatePass = async (_id, body) => {
  const gatePass = await GatePass.findById(_id);
  if (!gatePass) {
    throw new Error('Gate pass not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gatePass.societyId, FEATURES.SMART_GATE_PASS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  const data = await GatePass.findByIdAndUpdate(_id, body, { new: true });
  return data;
};

export const deleteGatePass = async (id) => {
  const gatePass = await GatePass.findById(id);
  if (!gatePass) {
    throw new Error('Gate pass not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gatePass.societyId, FEATURES.SMART_GATE_PASS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  await GatePass.findByIdAndDelete(id);
  return { success: true };
};

export const validateOTP = async (otp, societyId, flatId) => {
  // Check feature access
  const featureCheck = await checkFeatureAccess(societyId, FEATURES.SMART_GATE_PASS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  const { start, end } = getISTDayRange();
  let filter = {
    societyId,
    otp: parseInt(otp),
    expectedDate: {
      $gte: new Date(start),
      $lt: new Date(end)
    }
  };
  if (flatId) filter.flatId = flatId;

  return await GatePass.find(filter)
    .populate('societyId')
    .populate('flatId')
    .populate('userId')
    .populate('createdByUserId');
};

export const validateGatePass = async (gatePassId) => {
  const gatePass = await GatePass.findById(gatePassId)
    .populate('societyId')
    .populate('flatId')
    .populate('userId')
    .populate('createdByUserId');

  if (!gatePass) {
    throw new Error('Gate pass not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gatePass.societyId, FEATURES.SMART_GATE_PASS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return gatePass;
};