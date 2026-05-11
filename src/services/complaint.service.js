// services/complaint.service.js
import { Complaint, FlatMember } from '../models';
import { checkFeatureAccess } from './planCache.service';
import { FEATURES } from '../config/features';

export const createComplaint = async (data) => {
  // Check feature access
  const featureCheck = await checkFeatureAccess(data.societyId, FEATURES.COMPLAINTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  return Complaint.create(data);
};

export const deleteComplaint = async (id) => {
  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new Error('Complaint not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(complaint.societyId, FEATURES.COMPLAINTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  await Complaint.findByIdAndDelete(id);
  return { success: true };
};

export const getComplaints = async (filter, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  // If societyId is in filter, check feature access
  if (filter.societyId) {
    const featureCheck = await checkFeatureAccess(filter.societyId, FEATURES.COMPLAINTS);
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason);
    }
  }

  const [data, total] = await Promise.all([
    Complaint.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ floor: 1, flatNumber: 1 })
      .populate('flatId')
      .populate('societyId')
      .populate('assignedTo')
      .populate('createdByUserId'),
    Complaint.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page,
    limit,
    success: true
  };
};

export const updateStatus = async (
  complaintId,
  newStatus,
  userId,
  userSocities
) => {
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new Error('Complaint not found');
  }

  // Check feature access
  const featureCheck = await checkFeatureAccess(complaint.societyId, FEATURES.COMPLAINTS);
  if (!featureCheck.allowed) {
    throw new Error(featureCheck.reason);
  }

  if (complaint.status === newStatus) {
    return complaint; // no change needed
  }

  if (
    newStatus === 'closed' &&
    !(await checkIfComplaintIsOfUserFlat(complaintId, userId))
  ) {
    throw new Error('Access denied');
  }

  if (
    ['approved', 'rejected', 'in_progress'].includes(newStatus) &&
    !(await checkIfUserIsManagerOfSocietyOfComplaint(complaintId, userSocities))
  ) {
    throw new Error('Access denied');
  }

  return Complaint.findByIdAndUpdate(
    complaintId,
    {
      $set: {
        status: newStatus,
        modifiedOn: new Date(),
        modifiedByUserId: userId
      },
      $push: {
        history: {
          fromStatus: complaint.status,
          toStatus: newStatus,
          note: `Status changed by user ${userId}`
        }
      }
    },
    { new: true }
  );
};

const checkIfComplaintIsOfUserFlat = async (complaintId, userId) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return false;

  const flatMember = await FlatMember.find({
    flatId: complaint.flatId,
    userId,
    status: 'active'
  });
  if (flatMember.length === 0) return false;

  if (flatMember[0].isOwner) return true;

  const isTenant = flatMember[0].isTenant;
  const isMember = !flatMember[0].isTenant && !flatMember[0].isOwner;

  if (isTenant || (isMember && complaint.createdByUserId?.toString() !== userId.toString()))
    return false;

  return true;
};

const checkIfUserIsManagerOfSocietyOfComplaint = async (
  complaintId,
  userSocities
) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return false;

  const hasSocietyWithManagerRole = userSocities.some(
    (s) => {
      return s.societyId.toString() === complaint.societyId.toString() &&
        s.societyRoles.some((sr) => ['societyadmin', 'manager'].includes(sr.name))
    }
  );
  if (!hasSocietyWithManagerRole) return false;

  return true;
};