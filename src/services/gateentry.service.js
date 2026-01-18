import { GateEntry } from '../models';
import * as FlatService from '../services/flat.service';

export const createGateEntry = (data, fromUser, toUser) => {
  return GateEntry.create({
    ...data,
    societyId: data.societyId
  });
};

export const getGateEntries = async (filter, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([GateEntry.find(filter).skip(skip).limit(limit).sort({ createdOn: -1 }).populate('gatePassId').populate('societyId').populate('flatId').populate('approvedBy'), GateEntry.countDocuments(filter)]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const gettGateEntry = async (id) => {
  const data = await GateEntry.findById(id).populate('gatePassId').populate('societyId').populate('flatId').populate('approvedBy');
  return data;
};

export const deleteGateEntry = async (id) => {
  await GateEntry.findByIdAndDelete(id);
  return '';
};

export const updateGateEntryStatus = async (gateEntryId, newStatus, userId) => {
  const gateEntry = await GateEntry.findById(gateEntryId);
  if (!gateEntry) {
    throw new Error('Gate entry not found');
  }

  if (gateEntry.status === newStatus) {
    return gateEntry; // no change needed
  }

  if (['approved', 'rejected'].includes(newStatus) && !(await authorisedToApproveGateEntry(gateEntry, userId))) {
    throw new Error('Access denied');
  }

  if (['cancelled'].includes(newStatus) && !(await authorisedToCancelGateEntry(gateEntry, userId))) {
    throw new Error('Access denied');
  }

  const approvedByUpdate = ['approved', 'rejected'].includes(newStatus) ? { approvedBy: userId } : {};

  return GateEntry.findByIdAndUpdate(gateEntryId, {
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
        note: `Status changed by user ${userId}`
      }
    }
  });
};

export const updateGateEntryTime = async (gateEntryId) => {
  const gateEntry = await GateEntry.findById(gateEntryId);
  if (!gateEntry) {
    throw new Error('Gate entry not found');
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

const authorisedToApproveGateEntry = async (gateEntry, userId) => {
  const flatMembers = await FlatService.getFlatMembersByFlatId(gateEntry.flatId, userId);

  if (flatMembers.length > 0) return true;
  else return false;
};

const authorisedToCancelGateEntry = async (gateEntry, userId) => {
  if (gateEntry.craetedByUserId === userId) true;
  else return false;
};
