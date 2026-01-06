import { Complaint, FlatMember } from '../models';

export const createComplaint = (data) => {
  return Complaint.create(data);
};

export const deleteComplaint = async (id) => {
  await Complaint.findByIdAndDelete(id);
  return '';
};

export const getComplaints = async (filter, options = {}) => {
  const { page = 1, limit = 1000 } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Complaint.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ floor: 1, flatNumber: 1 })
      .populate('flatId')
      .populate('societyId')
      .populate('assignedTo')
      .populate('craetedByUserId'),
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
  const complaint = await Complaint.findOne(
    { _id: complaintId, isDeleted: { $ne: true } },
    { status: 1 }
  ).lean();

  if (!complaint) {
    throw new Error('Complaint not found');
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
    userId
  });
  if (flatMember.length === 0) return false;

  if (flatMember[0].isOwner) return true;

  const isTenant = flatMember[0].isTenant;
  const isMember = !flatMember[0].isTenant && !flatMember[0].isOwner;

  if (isTenant || (isMember && complaint.modifiedByUserId !== userId))
    return false;

  return true;
};

const checkIfUserIsManagerOfSocietyOfComplaint = async (
  complaintId,
  userSocities
) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) return false;

  const hasSocietyWithManagerRole = userSocities.find(
    (s) =>
      s.societyId === complaint.societyId &&
      s.societyRoles.some((sr) => ['societyadmin', 'manager'].includes(sr.name))
  );

  if (!hasSocietyWithManagerRole) return false;

  return true;
};
