import { Complaint } from '../models';

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

export const updateStatus = async (complaintId, newStatus, userId) => {
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
