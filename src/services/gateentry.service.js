import { GateEntry } from '../models';
import * as FlatService from '../services/flat.service';
import { checkFeatureAccess } from './planCache.service';
import { FEATURES } from '../config/features';

export const createGateEntry = async (data) => {
  // Check feature access
  const featureCheck = await checkFeatureAccess(data.societyId, FEATURES.GATE_ENTRIES);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return GateEntry.create({
    ...data,
    societyId: data.societyId
  });
};

export const getGateEntries = async (filter, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  // If societyId is in filter, check feature access
  const societyIdInFilter = filter.$and?.find(f => f.societyId)?.societyId;
  if (societyIdInFilter) {
    const featureCheck = await checkFeatureAccess(societyIdInFilter, FEATURES.GATE_ENTRIES);
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason);
    }
  }

  const [data, total] = await Promise.all([GateEntry.find(filter).skip(skip).limit(limit).sort({ createdOn: -1 }).populate('gatePassId').populate('societyId').populate('flatId').populate('approvedBy'), GateEntry.countDocuments(filter)]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const getGateEntry = async (id) => {
  const gateEntry = await GateEntry.findById(id).populate('gatePassId').populate('societyId').populate('flatId').populate('approvedBy');

  if (!gateEntry) {
    throw new Error('Gate entry not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gateEntry.societyId, FEATURES.GATE_ENTRIES);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return gateEntry;
};

export const deleteGateEntry = async (id) => {
  const gateEntry = await GateEntry.findById(id);
  if (!gateEntry) {
    throw new Error('Gate entry not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gateEntry.societyId, FEATURES.GATE_ENTRIES);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  await GateEntry.findByIdAndDelete(id);
  return { success: true };
};

export const updateGateEntryStatus = async (gateEntryId, newStatus, userId) => {
  const gateEntry = await GateEntry.findById(gateEntryId);
  if (!gateEntry) {
    throw new Error('Gate entry not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gateEntry.societyId, FEATURES.GATE_ENTRIES);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  if (gateEntry.status === newStatus) {
    return gateEntry;
  }

  if (['approved', 'rejected'].includes(newStatus) && !(await authorisedToApproveGateEntry(gateEntry, userId))) {
    throw new Error('Access denied');
  }

  if (['cancelled'].includes(newStatus) && !(await authorisedToCancelGateEntry(gateEntry, userId))) {
    throw new Error('Access denied');
  }

  const approvedByUpdate = ['approved', 'rejected'].includes(newStatus) ? { approvedBy: userId } : {};

  return GateEntry.findByIdAndUpdate(
    gateEntryId,
    {
      $set: {
        status: newStatus,
        modifiedOn: new Date(),
        modifiedByUserId: userId,
        ...approvedByUpdate
      },
      $push: {
        history: {
          fromStatus: gateEntry.status,
          toStatus: newStatus,
          note: `Status changed by user ${userId}`,
          createdOn: new Date(),
          createdByUserId: userId
        }
      }
    },
    { new: true }
  );
};

export const updateGateEntryTime = async (gateEntryId) => {
  const gateEntry = await GateEntry.findById(gateEntryId);
  if (!gateEntry) {
    throw new Error('Gate entry not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gateEntry.societyId, FEATURES.GATE_ENTRIES);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return GateEntry.findByIdAndUpdate(
    gateEntryId,
    {
      $set: {
        entryTime: new Date()
      }
    },
    { new: true }
  );
};

export const updateGateExitTime = async (gateEntryId, userId) => {
  const gateEntry = await GateEntry.findById(gateEntryId);
  if (!gateEntry) {
    throw new Error('Gate entry not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(gateEntry.societyId, FEATURES.GATE_ENTRIES);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return GateEntry.findByIdAndUpdate(
    gateEntryId,
    {
      $set: {
        exitTime: new Date(),
        modifiedOn: new Date(),
        modifiedByUserId: userId
      }
    },
    { new: true }
  );
};

const authorisedToApproveGateEntry = async (gateEntry, userId) => {
  const flatMembers = await FlatService.getFlatMembersByFlatId(gateEntry.flatId, userId);
  return flatMembers.length > 0;
};

const authorisedToCancelGateEntry = async (gateEntry, userId) => {
  return gateEntry.createdByUserId?.toString() === userId.toString();
};