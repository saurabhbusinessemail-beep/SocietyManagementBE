const { RentPayment, Flat, FlatMember, RentReminder } = require('../models');
const mongoose = require('mongoose');

/**
 * Record a new rent payment
 */
export const recordPayment = async (data) => {
  // Check if payment already exists for this flat/month/year/tenant
  const existing = await RentPayment.findOne({
    flatId: data.flatId,
    flatMemberId: data.flatMemberId,
    month: data.month,
    year: data.year,
    status: { $in: ['pending_approval', 'approved'] },
    isDeleted: { $ne: true }
  });

  if (existing) {
    throw new Error(`Rent payment already exists for this flat for ${data.month}/${data.year}`);
  }

  const payment = await RentPayment.create(data);
  return payment;
};

/**
 * Approve a pending rent payment
 */
export const approvePayment = async (paymentId, userId) => {
  const payment = await RentPayment.findByIdAndUpdate(
    paymentId,
    {
      status: 'approved',
      approvedBy: userId,
      modifiedOn: new Date(),
      modifiedByUserId: userId
    },
    { new: true }
  ).populate('flatId', 'flatNumber floor')
   .populate('flatMemberId', 'name contact isOwner isTenant');

  if (!payment) throw new Error('Payment not found');
  return payment;
};

/**
 * Reject a pending rent payment
 */
export const rejectPayment = async (paymentId, userId, reason) => {
  const payment = await RentPayment.findByIdAndUpdate(
    paymentId,
    {
      status: 'rejected',
      approvedBy: userId,
      rejectionReason: reason,
      modifiedOn: new Date(),
      modifiedByUserId: userId
    },
    { new: true }
  ).populate('flatId', 'flatNumber floor')
   .populate('flatMemberId', 'name contact isOwner isTenant');

  if (!payment) throw new Error('Payment not found');
  return payment;
};

/**
 * Get payments for a specific flat
 */
export const getPaymentsByFlat = async (societyId, flatId, month, year, flatMemberId) => {
  const filter = {
    flatId,
    isDeleted: { $ne: true }
  };
  if (societyId) filter.societyId = societyId;
  if (month) filter.month = month;
  if (year) filter.year = year;
  if (flatMemberId) filter.flatMemberId = flatMemberId;

  return RentPayment.find(filter)
    .populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant')
    .populate('recordedBy', 'name phoneNumber')
    .populate('approvedBy', 'name phoneNumber')
    .sort({ year: -1, month: -1 });
};

/**
 * Get all rent payments for a society with filters
 */
export const getAllPayments = async (societyId, filters = {}) => {
  const query = {
    societyId,
    isDeleted: { $ne: true }
  };

  if (filters.month) query.month = parseInt(filters.month);
  if (filters.year) query.year = parseInt(filters.year);
  if (filters.status) query.status = filters.status;
  if (filters.flatId) query.flatId = filters.flatId;
  if (filters.flatMemberId) query.flatMemberId = filters.flatMemberId;

  return RentPayment.find(query)
    .populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant')
    .populate('recordedBy', 'name phoneNumber')
    .populate('approvedBy', 'name phoneNumber')
    .sort({ createdOn: -1 });
};

/**
 * Get pending approvals for a flat (for owner)
 */
export const getPendingApprovals = async (flatId) => {
  return RentPayment.find({
    flatId,
    status: 'pending_approval',
    isDeleted: { $ne: true }
  }).populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant')
    .populate('recordedBy', 'name phoneNumber')
    .sort({ createdOn: -1 });
};

/**
 * Update a payment (owner edit amount)
 */
export const updatePayment = async (paymentId, data, userId) => {
  const updateData = {
    ...data,
    modifiedOn: new Date(),
    modifiedByUserId: userId
  };

  // If owner is editing, auto-approve
  if (data.isOwnerRecorded) {
    updateData.status = 'approved';
    updateData.approvedBy = userId;
  }

  const payment = await RentPayment.findByIdAndUpdate(
    paymentId,
    updateData,
    { new: true }
  ).populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant');

  if (!payment) throw new Error('Payment not found');
  return payment;
};

/**
 * Get rent summary for a flat (current month)
 */
export const getRentSummary = async (flatId, month, year) => {
  const tenants = await FlatMember.find({
    flatId,
    status: { $nin: ['expired', 'terminated'] },
    isTenant: true
  }).lean();
  
  const totalTenants = tenants.length;

  const payments = await RentPayment.find({
    flatId,
    month,
    year,
    isDeleted: { $ne: true }
  }).lean();

  // Use a map to track unique tenants and their best status
  const tenantStatusMap = {};
  const priority = { 'approved': 1, 'pending_approval': 2, 'rejected': 3 };

  payments.forEach(p => {
    const tenantId = p.flatMemberId.toString();
    const currentStatus = p.status;
    const existingStatus = tenantStatusMap[tenantId];

    if (!existingStatus || (priority[currentStatus] || 99) < (priority[existingStatus] || 99)) {
      tenantStatusMap[tenantId] = currentStatus;
    }
  });

  let paidCount = 0;
  let pendingApprovalCount = 0;
  Object.values(tenantStatusMap).forEach(status => {
    if (status === 'approved') paidCount++;
    else if (status === 'pending_approval') pendingApprovalCount++;
  });

  const totalCollected = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  const totalRentExpected = tenants.reduce((sum, t) => sum + (t.rentAmount || 0), 0);
  const pendingAmount = Math.max(0, totalRentExpected - totalCollected);
  const notPaidCount = totalTenants - paidCount - pendingApprovalCount;

  return {
    totalTenants,
    paidCount,
    pendingApprovalCount,
    notPaidCount,
    totalCollected,
    totalRentExpected,
    pendingAmount
  };
};

/**
 * Get monthly report: all tenants of a flat with their payment status for a given month/year
 */
export const getMonthlyReport = async (flatId, month, year) => {
  const tenants = await FlatMember.find({
    flatId,
    status: { $nin: ['expired', 'terminated'] },
    isTenant: true
  }).populate('userId', 'name phoneNumber profilePicture').lean();

  const payments = await RentPayment.find({
    flatId,
    month,
    year,
    isDeleted: { $ne: true }
  }).populate('flatMemberId', 'name contact isOwner isTenant')
    .populate('recordedBy', 'name phoneNumber')
    .populate('approvedBy', 'name phoneNumber')
    .lean();

  const reminders = await RentReminder.find({
    flatId,
    month,
    year,
    isDeleted: { $ne: true }
  }).sort({ sentOn: -1 }).lean();

  const paymentMap = {};
  payments.sort((a, b) => {
    const priority = { 'approved': 1, 'pending_approval': 2, 'rejected': 3 };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });
  
  payments.forEach(p => {
    const tenantIdStr = p.flatMemberId?._id?.toString() || p.flatMemberId?.toString();
    if (!paymentMap[tenantIdStr]) {
      paymentMap[tenantIdStr] = p;
    }
  });

  const reportEntries = tenants.map(tenant => {
    const tenantId = tenant._id.toString();
    const payment = paymentMap[tenantId];

    return {
      flatMemberId: tenant._id,
      memberName: tenant.userId?.name || tenant.name || '—',
      memberContact: tenant.contact || '—',
      rentAmountExpected: tenant.rentAmount || 0,
      payment: payment || null,
      status: payment
        ? payment.status
        : 'not_paid',
      lastReminderSent: reminders.find(r => r.flatMemberId.toString() === tenantId)?.sentOn || null
    };
  });

  const paidCount = reportEntries.filter(e => e.status === 'approved').length;
  const pendingApprovalCount = reportEntries.filter(e => e.status === 'pending_approval').length;
  const totalCollected = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalRentExpected = tenants.reduce((sum, t) => sum + (t.rentAmount || 0), 0);
  
  const pendingAmount = Math.max(0, totalRentExpected - totalCollected);
  const notPaidCount = tenants.length - paidCount - pendingApprovalCount;

  return {
    summary: {
      totalTenants: tenants.length,
      paidCount,
      pendingApprovalCount,
      notPaidCount,
      totalCollected,
      totalRentExpected,
      pendingAmount
    },
    entries: reportEntries
  };
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId) => {
  return RentPayment.findById(paymentId)
    .populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant userId')
    .populate('recordedBy', 'name phoneNumber')
    .populate('approvedBy', 'name phoneNumber');
};

/**
 * Delete a payment record (soft delete)
 */
export const deletePayment = async (paymentId, userId) => {
  const payment = await RentPayment.findByIdAndUpdate(
    paymentId,
    {
      isDeleted: true,
      modifiedOn: new Date(),
      modifiedByUserId: userId
    },
    { new: true }
  );

  if (!payment) throw new Error('Payment not found');
  return payment;
};

/**
 * Send rent reminder to a specific tenant
 */
export const sendReminder = async (societyId, flatId, tenantId, month, year, fromUser) => {
  const flat = await Flat.findById(flatId).lean();
  if (!flat) throw new Error('Flat not found');

  const member = await FlatMember.findOne({
    _id: tenantId,
    flatId,
    status: { $nin: ['expired', 'terminated'] },
    isTenant: true
  }).populate('userId').lean();

  if (!member) throw new Error('Tenant not found or inactive');

  const reminderData = {
    societyId,
    flatNumber: flat.flatNumber,
    month,
    year
  };

  const results = [];
  const SMSService = require('./sms.service');
  const NotificationService = require('./notification.service');

  if (member.userId) {
    // Send Notification
    if (member.userId.fcmToken) {
      await NotificationService.sendRentReminderNotification(fromUser, member.userId._id, reminderData, member.userId.fcmToken);
    }

    // Send SMS
    if (process.env.SEND_MESSAGES === 'true' && member.contact) {
      await SMSService.sendRentReminderSMS(reminderData, member.contact);
    }

    results.push({ name: member.name, status: 'sent' });

    // Save Reminder Log
    await RentReminder.create({
      societyId,
      flatId,
      flatMemberId: member._id,
      userId: member.userId._id,
      month,
      year,
      sentBy: fromUser,
      type: (member.userId.fcmToken && process.env.SEND_MESSAGES === 'true') ? 'both' : member.userId.fcmToken ? 'notification' : 'sms',
      createdByUserId: fromUser,
      createdOn: new Date()
    });
  }

  return results;
};

/**
 * Send reminders to all pending tenants in a flat for a given month/year
 */
export const remindAll = async (societyId, flatId, month, year, fromUser) => {
  const tenants = await FlatMember.find({
    flatId,
    status: { $nin: ['expired', 'terminated'] },
    isTenant: true
  }).lean();
  
  const payments = await RentPayment.find({
    flatId,
    month,
    year,
    status: 'approved',
    isDeleted: { $ne: true }
  }).lean();
  
  const paidTenantIds = payments.map(p => p.flatMemberId.toString());
  
  const pendingTenants = tenants.filter(t => !paidTenantIds.includes(t._id.toString()));
  
  const overallResults = [];
  
  for (const tenant of pendingTenants) {
    try {
      const flatResults = await sendReminder(societyId, flatId, tenant._id, month, year, fromUser);
      overallResults.push({
        tenantName: tenant.name,
        members: flatResults
      });
    } catch (err) {
      console.error(`Failed to send reminder for tenant ${tenant.name}:`, err);
    }
  }
  
  return overallResults;
};

/**
 * Get merged logs for a flat (payments + reminders)
 */
export const getMergedLogs = async (societyId, flatId, filters = {}) => {
  const paymentQuery = { flatId, isDeleted: { $ne: true } };
  const reminderQuery = { flatId, isDeleted: { $ne: true } };

  if (filters.month) {
    paymentQuery.month = parseInt(filters.month);
    reminderQuery.month = parseInt(filters.month);
  }
  if (filters.year) {
    paymentQuery.year = parseInt(filters.year);
    reminderQuery.year = parseInt(filters.year);
  }

  const [payments, reminders] = await Promise.all([
    RentPayment.find(paymentQuery)
      .populate('recordedBy', 'name phoneNumber')
      .populate('approvedBy', 'name phoneNumber')
      .populate('flatMemberId', 'name contact isOwner isTenant')
      .lean(),
    RentReminder.find(reminderQuery)
      .populate('sentBy', 'name phoneNumber')
      .populate('flatMemberId', 'name contact isOwner isTenant')
      .lean()
  ]);

  // Merge and normalize
  const logs = [
    ...payments.map(p => ({
      ...p,
      logType: 'payment',
      date: p.paidOn || p.createdOn
    })),
    ...reminders.map(r => ({
      ...r,
      logType: 'reminder',
      date: r.sentOn
    }))
  ];

  // Sort descending
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Get flat and society details for context
  const flat = await Flat.findById(flatId).populate('buildingId', 'buildingNumber').lean();
  const { Society, FlatMember } = require('../models');
  const society = await Society.findById(societyId || flat.societyId).select('societyName').lean();
  
  // Get owner details
  const owner = await FlatMember.findOne({
    flatId,
    status: { $nin: ['expired', 'terminated'] },
    isOwner: true
  }).populate('userId', 'name phoneNumber profilePicture').lean();

  return {
    logs,
    flat: {
      flatNumber: flat?.flatNumber,
      floor: flat?.floor,
      buildingNumber: flat?.buildingId?.buildingNumber,
      societyName: society?.societyName,
      owner: owner ? {
        name: owner.userId?.name || owner.name,
        contact: owner.contact,
        user: owner.userId
      } : null
    }
  };
};
