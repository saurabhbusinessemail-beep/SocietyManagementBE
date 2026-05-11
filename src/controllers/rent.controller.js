import * as rentService from '../services/rent.service';
import * as NotificationService from '../services/notification.service';
import * as SMSService from '../services/sms.service';
import { FlatMember, User } from '../models';
import * as FlatService from '../services/flat.service';

/**
 * Record a rent payment (tenant or owner)
 */
export const recordPayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { societyId, flatId, flatMemberId, amount, month, year, paymentMethod, paymentDetails, paidOn, note } = req.body;

    // Determine if user is owner of this flat
    const ownerMember = await FlatMember.findOne({ flatId, userId: user._id, isOwner: true, status: { $nin: ['expired', 'terminated'] } });
    const isOwner = !!ownerMember;

    const paymentData = {
      societyId,
      flatId,
      flatMemberId,
      amount,
      month,
      year,
      paymentMethod,
      paymentDetails,
      paidOn: paidOn || new Date(),
      note,
      recordedBy: user._id,
      isOwnerRecorded: isOwner,
      status: isOwner ? 'approved' : 'pending_approval',
      createdOn: new Date(),
      createdByUserId: user._id
    };

    if (isOwner) {
      paymentData.approvedBy = user._id;
    }

    const payment = await rentService.recordPayment(paymentData);

    // If tenant recorded, notify owner
    if (!isOwner) {
      try {
        await notifyOwnerOfPayment(user, flatId, payment);
      } catch (err) {
        console.error('Error sending rent payment notification:', err);
      }
    }

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * Approve a pending rent payment
 */
export const approvePayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const payment = await rentService.approvePayment(id, user._id);

    // Notify the tenant
    try {
      await notifyTenantOfApproval(user, payment, 'approved');
    } catch (err) {
      console.error('Error sending rent approval notification:', err);
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * Reject a pending rent payment
 */
export const rejectPayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const { reason } = req.body;
    const payment = await rentService.rejectPayment(id, user._id, reason);

    // Notify the tenant
    try {
      await notifyTenantOfApproval(user, payment, 'rejected');
    } catch (err) {
      console.error('Error sending rent rejection notification:', err);
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * Get payments for a flat
 */
export const getPaymentsByFlat = async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const { societyId, month, year, flatMemberId } = req.query;

    const payments = await rentService.getPaymentsByFlat(societyId, flatId, month, year, flatMemberId);
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

/**
 * Get merged logs for a flat (payments + reminders)
 */
export const getLogs = async (req, res, next) => {
  try {
    const { flatId } = req.params;
    const { societyId, month, year } = req.query;

    const logs = await rentService.getMergedLogs(societyId, flatId, { month, year });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a payment (owner edit)
 */
export const updatePayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const updateData = req.body;
    updateData.isOwnerRecorded = true;

    const payment = await rentService.updatePayment(id, updateData, user._id);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * Get pending approvals for a flat
 */
export const getPendingApprovals = async (req, res, next) => {
  try {
    const { flatId } = req.query;
    if (!flatId) {
      return res.status(400).json({ success: false, message: 'flatId is required' });
    }

    const payments = await rentService.getPendingApprovals(flatId);
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

/**
 * Get rent summary (paid/pending/total counts)
 */
export const getRentSummary = async (req, res, next) => {
  try {
    const { flatId, month, year } = req.query;
    if (!flatId) {
      return res.status(400).json({ success: false, message: 'flatId is required' });
    }

    const now = new Date();
    const m = month || (now.getMonth() + 1);
    const y = year || now.getFullYear();

    const summary = await rentService.getRentSummary(flatId, m, y);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

/**
 * Get monthly report
 */
export const getMonthlyReport = async (req, res, next) => {
  try {
    const { flatId, month, year } = req.body;
    if (!flatId || !month || !year) {
      return res.status(400).json({ success: false, message: 'flatId, month, and year are required' });
    }

    const report = await rentService.getMonthlyReport(flatId, month, year);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all rent payments with filters
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const { societyId, month, year, status, flatId, flatMemberId } = req.query;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'societyId is required' });
    }

    const payments = await rentService.getAllPayments(societyId, { month, year, status, flatId, flatMemberId });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

/**
 * Send reminder for rent payment
 */
export const sendReminder = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { societyId, flatId, tenantId, month, year } = req.body;
    if (!societyId || !flatId || !tenantId || !month || !year) {
      return res.status(400).json({ success: false, message: 'societyId, flatId, tenantId, month, and year are required' });
    }


    const results = await rentService.sendReminder(societyId, flatId, tenantId, month, year, user);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * Send reminders to all pending tenants
 */
export const remindAll = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { societyId, flatId, month, year } = req.body;
    if (!societyId || !flatId || !month || !year) {
      return res.status(400).json({ success: false, message: 'societyId, flatId, month, and year are required' });
    }

    const results = await rentService.remindAll(societyId, flatId, month, year, user);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await rentService.getPaymentById(id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a payment record
 */
export const deletePayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    await rentService.deletePayment(id, user._id);
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/* ---- Notification Helpers ---- */

/**
 * Notify owner of a flat when a tenant records payment
 */
async function notifyOwnerOfPayment(fromUser, flatId, payment) {
  const { FlatMember } = require('../models');
  const ownerMembers = await FlatMember.find({ flatId, isOwner: true, status: { $nin: ['expired', 'terminated'] } }).populate('userId');
  if (!ownerMembers || ownerMembers.length === 0) return;

  for (const ownerRef of ownerMembers) {
    const owner = ownerRef.userId;
    if (!owner) continue;
    if (owner._id.toString() === fromUser._id.toString()) continue;

    // Send push notification
    if (owner.fcmToken) {
      await NotificationService.sendRentPaymentNotification(fromUser, owner._id, payment, owner.fcmToken);
    }

    // Send SMS
    if (process.env.SEND_MESSAGES === 'true' && owner.phoneNumber) {
      await SMSService.sendRentPaymentSMS(payment, owner.phoneNumber);
    }
  }
}

/**
 * Notify the tenant when their payment is approved/rejected
 */
async function notifyTenantOfApproval(fromUser, payment, status) {
  if (!payment.recordedBy) return;

  const recordedByUserId = typeof payment.recordedBy === 'string' ? payment.recordedBy : payment.recordedBy._id;
  const tenant = await User.findById(recordedByUserId);
  if (!tenant) return;

  // Send push notification
  if (tenant.fcmToken) {
    await NotificationService.sendRentApprovalNotification(fromUser, tenant._id, payment, status, tenant.fcmToken);
  }

  // Send SMS
  if (process.env.SEND_MESSAGES === 'true' && tenant.phoneNumber) {
    await SMSService.sendRentApprovalSMS(payment, status, tenant.phoneNumber);
  }
}
