const { MaintenancePayment, Flat, FlatMember, MaintenanceReminder } = require('../models');
const mongoose = require('mongoose');

/**
 * Record a new maintenance payment
 */
export const recordPayment = async (data) => {
  // Check if payment already exists for this flat/month/year
  const existing = await MaintenancePayment.findOne({
    flatId: data.flatId,
    month: data.month,
    year: data.year,
    status: { $in: ['pending_approval', 'approved'] },
    isDeleted: { $ne: true }
  });

  if (existing) {
    throw new Error(`Maintenance payment already exists for this flat for ${data.month}/${data.year}`);
  }

  const payment = await MaintenancePayment.create(data);
  return payment;
};

/**
 * Approve a pending maintenance payment
 */
export const approvePayment = async (paymentId, userId) => {
  const payment = await MaintenancePayment.findByIdAndUpdate(
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
 * Reject a pending maintenance payment
 */
export const rejectPayment = async (paymentId, userId, reason) => {
  const payment = await MaintenancePayment.findByIdAndUpdate(
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
export const getPaymentsByFlat = async (societyId, flatId, month, year) => {
  const filter = {
    flatId,
    isDeleted: { $ne: true }
  };
  if (societyId) filter.societyId = societyId;
  if (month) filter.month = month;
  if (year) filter.year = year;

  return MaintenancePayment.find(filter)
    .populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant')
    .populate('recordedBy', 'name phoneNumber')
    .populate('approvedBy', 'name phoneNumber')
    .sort({ year: -1, month: -1 });
};

/**
 * Get all maintenance payments for a society with filters
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

  return MaintenancePayment.find(query)
    .populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant')
    .populate('recordedBy', 'name phoneNumber')
    .populate('approvedBy', 'name phoneNumber')
    .sort({ createdOn: -1 });
};

/**
 * Get monthly report: all flats with their payment status for a given month/year
 */
export const getMonthlyReport = async (societyId, month, year) => {
  // Get all flats in the society
  const flats = await Flat.find({ societyId }).lean();
  const flatIds = flats.map(f => f._id);

  // Get all active flat members (owners or tenants who are currently active)
  const flatMembers = await FlatMember.find({
    societyId,
    flatId: { $in: flatIds },
    status: 'active',
    $or: [{ isOwner: true }, { isTenant: true }]
  }).lean();

  // Get payments for this month/year
  const payments = await MaintenancePayment.find({
    societyId,
    month,
    year,
    isDeleted: { $ne: true }
  }).populate('flatMemberId', 'name contact isOwner isTenant')
    .populate('recordedBy', 'name phoneNumber')
    .populate('approvedBy', 'name phoneNumber')
    .lean();

  // Get reminders for this month/year
  const reminders = await MaintenanceReminder.find({
    societyId,
    month,
    year,
    isDeleted: { $ne: true }
  }).sort({ sentOn: -1 }).lean();

  // Build payment map: flatId -> payment (pick best status: approved > pending > rejected)
  const paymentMap = {};
  payments.sort((a, b) => {
    const priority = { 'approved': 1, 'pending_approval': 2, 'rejected': 3 };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });
  
  payments.forEach(p => {
    const flatIdStr = p.flatId.toString();
    if (!paymentMap[flatIdStr]) {
      paymentMap[flatIdStr] = p;
    }
  });

  // Build report entries
  const reportEntries = flats.map(flat => {
    const flatId = flat._id.toString();
    const payment = paymentMap[flatId];
    const members = flatMembers.filter(m => m.flatId.toString() === flatId);
    const primaryMember = members.find(m => m.isTenant) || members.find(m => m.isOwner);

    return {
      flatId: flat._id,
      flatNumber: flat.flatNumber,
      floor: flat.floor,
      memberName: primaryMember?.name || '—',
      memberContact: primaryMember?.contact || '—',
      memberType: primaryMember?.isTenant ? 'Tenant' : primaryMember?.isOwner ? 'Owner' : '—',
      flatMemberId: primaryMember?._id,
      payment: payment || null,
      status: payment
        ? payment.status
        : 'not_paid',
      lastReminderSent: reminders.find(r => r.flatId.toString() === flatId)?.sentOn || null
    };
  });

  // Summary
  const paidCount = reportEntries.filter(e => e.status === 'approved').length;
  const pendingCount = reportEntries.filter(e => e.status === 'pending_approval').length;
  const totalCollected = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    summary: {
      totalFlats: flats.length,
      paidCount,
      pendingCount,
      totalCollected
    },
    entries: reportEntries
  };
};

/**
 * Get yearly report: month-by-month summary for a given year
 */
export const getYearlyReport = async (societyId, year) => {
  const flats = await Flat.find({ societyId }).lean();
  const totalFlats = flats.length;

  const payments = await MaintenancePayment.find({
    societyId,
    year,
    isDeleted: { $ne: true }
  }).lean();

  // Group by month
  const monthlyData = [];
  for (let month = 1; month <= 12; month++) {
    const monthPayments = payments.filter(p => p.month === month);
    const paidCount = monthPayments.filter(p => p.status === 'approved').length;
    const pendingCount = monthPayments.filter(p => p.status === 'pending_approval').length;
    const totalCollected = monthPayments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    monthlyData.push({
      month,
      totalFlats,
      paidCount,
      pendingCount,
      notPaidCount: totalFlats - paidCount - pendingCount,
      totalCollected
    });
  }

  return {
    year,
    totalFlats,
    months: monthlyData
  };
};

/**
 * Get pending approvals for a society
 */
export const getPendingApprovals = async (societyId) => {
  return MaintenancePayment.find({
    societyId,
    status: 'pending_approval',
    isDeleted: { $ne: true }
  }).populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant')
    .populate('recordedBy', 'name phoneNumber')
    .sort({ createdOn: -1 });
};

/**
 * Update a payment (admin edit amount)
 */
export const updatePayment = async (paymentId, data, userId) => {
  const updateData = {
    ...data,
    modifiedOn: new Date(),
    modifiedByUserId: userId
  };

  // If admin is editing, auto-approve
  if (data.isAdminRecorded) {
    updateData.status = 'approved';
    updateData.approvedBy = userId;
  }

  const payment = await MaintenancePayment.findByIdAndUpdate(
    paymentId,
    updateData,
    { new: true }
  ).populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant');

  if (!payment) throw new Error('Payment not found');
  return payment;
};

/**
 * Get maintenance summary for a society (current month)
 */
export const getMaintenanceSummary = async (societyId, month, year) => {
  const flats = await Flat.find({ societyId }).lean();
  const totalFlats = flats.length;

  const payments = await MaintenancePayment.find({
    societyId,
    month,
    year,
    isDeleted: { $ne: true }
  }).lean();

  // Use a map to track unique flats and their best status
  const flatStatusMap = {};
  const priority = { 'approved': 1, 'pending_approval': 2, 'rejected': 3 };

  payments.forEach(p => {
    const flatId = p.flatId.toString();
    const currentStatus = p.status;
    const existingStatus = flatStatusMap[flatId];

    if (!existingStatus || (priority[currentStatus] || 99) < (priority[existingStatus] || 99)) {
      flatStatusMap[flatId] = currentStatus;
    }
  });

  let paidCount = 0;
  let pendingCount = 0;
  Object.values(flatStatusMap).forEach(status => {
    if (status === 'approved') paidCount++;
    else if (status === 'pending_approval') pendingCount++;
  });

  const totalCollected = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    totalFlats,
    paidCount,
    pendingCount,
    totalCollected
  };
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId) => {
  return MaintenancePayment.findById(paymentId)
    .populate('flatId', 'flatNumber floor')
    .populate('flatMemberId', 'name contact isOwner isTenant userId')
    .populate('recordedBy', 'name phoneNumber')
    .populate('approvedBy', 'name phoneNumber');
};

/**
 * Delete a payment record (soft delete)
 */
export const deletePayment = async (paymentId, userId) => {
  const payment = await MaintenancePayment.findByIdAndUpdate(
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
 * Send maintenance reminder to flat members
 */
export const sendReminder = async (societyId, flatId, month, year, fromUser) => {
  const flat = await Flat.findById(flatId).lean();
  if (!flat) throw new Error('Flat not found');

  const members = await FlatMember.find({
    flatId,
    status: 'active',
    $or: [{ isOwner: true }, { isTenant: true }]
  }).populate('userId').lean();

  if (members.length === 0) throw new Error('No active members found for this flat');

  const results = [];
  const reminderData = {
    societyId,
    flatNumber: flat.flatNumber,
    month,
    year
  };

  const SMSService = require('./sms.service');
  const NotificationService = require('./notification.service');

  for (const member of members) {
    if (!member.userId) continue;

    // Send Notification
    if (member.userId.fcmToken) {
      await NotificationService.sendMaintenanceReminderNotification(fromUser, member.userId._id, reminderData, member.userId.fcmToken);
    }

    // Send SMS
    if (process.env.SEND_MESSAGES === 'true' && member.contact) {
      await SMSService.sendMaintenanceReminderSMS(reminderData, member.contact);
    }
    

    results.push({ name: member.name, status: 'sent' });

    // Save Reminder Log
    await MaintenanceReminder.create({
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
 * Send reminders to all pending flats in a society for a given month/year
 */
export const remindAll = async (societyId, month, year, fromUser) => {
  const report = await getMonthlyReport(societyId, month, year);
  const pendingEntries = report.entries.filter(e => e.status === 'not_paid' || e.status === 'rejected');
  
  const overallResults = [];
  
  for (const entry of pendingEntries) {
    try {
      const flatResults = await sendReminder(societyId, entry.flatId, month, year, fromUser);
      overallResults.push({
        flatNumber: entry.flatNumber,
        members: flatResults
      });
    } catch (err) {
      console.error(`Failed to send reminder for flat ${entry.flatNumber}:`, err);
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
    MaintenancePayment.find(paymentQuery)
      .populate('recordedBy', 'name phoneNumber')
      .populate('approvedBy', 'name phoneNumber')
      .populate('flatMemberId', 'name contact isOwner isTenant')
      .lean(),
    MaintenanceReminder.find(reminderQuery)
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

  return logs;
};
