import * as maintenanceService from '../services/maintenance.service';
import * as NotificationService from '../services/notification.service';
import * as SMSService from '../services/sms.service';
import { FlatMember, User } from '../models';
import * as FlatService from '../services/flat.service';

/**
 * Record a maintenance payment (payee or admin)
 */
export const recordPayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const societies = res.locals.socities;
    const { societyId, flatId, flatMemberId, amount, month, year, paymentMethod, paymentDetails, paidOn, note } = req.body;

    // Determine if user is admin/manager of this society
    const isAdmin = societies.some(s =>
      s.societyId === societyId &&
      s.societyRoles.some(sr => ['admin', 'manager'].includes(sr.name))
    );

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
      isAdminRecorded: isAdmin,
      status: isAdmin ? 'approved' : 'pending_approval',
      createdOn: new Date(),
      createdByUserId: user._id
    };

    if (isAdmin) {
      paymentData.approvedBy = user._id;
    }

    const payment = await maintenanceService.recordPayment(paymentData);

    // If payee recorded, notify admins/managers
    if (!isAdmin) {
      try {
        await notifyAdminsOfPayment(user, societyId, payment);
      } catch (err) {
        console.error('Error sending maintenance payment notification:', err);
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
 * Approve a pending maintenance payment
 */
export const approvePayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const payment = await maintenanceService.approvePayment(id, user._id);

    // Notify the payee
    try {
      await notifyPayeeOfApproval(user, payment, 'approved');
    } catch (err) {
      console.error('Error sending maintenance approval notification:', err);
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * Reject a pending maintenance payment
 */
export const rejectPayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const { reason } = req.body;
    const payment = await maintenanceService.rejectPayment(id, user._id, reason);

    // Notify the payee
    try {
      await notifyPayeeOfApproval(user, payment, 'rejected');
    } catch (err) {
      console.error('Error sending maintenance rejection notification:', err);
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * Get monthly report
 */
export const getMonthlyReport = async (req, res, next) => {
  try {
    const { societyId, month, year } = req.body;
    if (!societyId || !month || !year) {
      return res.status(400).json({ success: false, message: 'societyId, month, and year are required' });
    }

    const report = await maintenanceService.getMonthlyReport(societyId, month, year);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

/**
 * Get yearly report
 */
export const getYearlyReport = async (req, res, next) => {
  try {
    const { societyId, year } = req.body;
    if (!societyId || !year) {
      return res.status(400).json({ success: false, message: 'societyId and year are required' });
    }

    const report = await maintenanceService.getYearlyReport(societyId, year);
    res.json({ success: true, data: report });
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
    const { societyId, month, year } = req.query;

    const payments = await maintenanceService.getPaymentsByFlat(societyId, flatId, month, year);
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

    const logs = await maintenanceService.getMergedLogs(societyId, flatId, { month, year });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a payment (admin edit)
 */
export const updatePayment = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const updateData = req.body;
    updateData.isAdminRecorded = true;

    const payment = await maintenanceService.updatePayment(id, updateData, user._id);
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/**
 * Get pending approvals
 */
export const getPendingApprovals = async (req, res, next) => {
  try {
    const { societyId } = req.query;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'societyId is required' });
    }

    const payments = await maintenanceService.getPendingApprovals(societyId);
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

/**
 * Get maintenance summary (paid/pending/total counts)
 */
export const getMaintenanceSummary = async (req, res, next) => {
  try {
    const { societyId, month, year } = req.query;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'societyId is required' });
    }

    const now = new Date();
    const m = month || (now.getMonth() + 1);
    const y = year || now.getFullYear();

    const summary = await maintenanceService.getMaintenanceSummary(societyId, m, y);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all maintenance payments with filters
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const { societyId, month, year, status, flatId } = req.query;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'societyId is required' });
    }

    const payments = await maintenanceService.getAllPayments(societyId, { month, year, status, flatId });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

/**
 * Send reminder for maintenance payment
 */
export const sendReminder = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { societyId, flatId, month, year } = req.body;
    if (!societyId || !flatId || !month || !year) {
      return res.status(400).json({ success: false, message: 'societyId, flatId, month, and year are required' });
    }


    const results = await maintenanceService.sendReminder(societyId, flatId, month, year, user);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * Send reminders to all pending flats
 */
export const remindAll = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { societyId, month, year } = req.body;
    if (!societyId || !month || !year) {
      return res.status(400).json({ success: false, message: 'societyId, month, and year are required' });
    }

    const results = await maintenanceService.remindAll(societyId, month, year, user);
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
    const payment = await maintenanceService.getPaymentById(id);
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
    await maintenanceService.deletePayment(id, user._id);
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/* ---- Notification Helpers ---- */

/**
 * Notify admins/managers of a society when a payee records payment
 */
async function notifyAdminsOfPayment(fromUser, societyId, payment) {
  const { Society } = require('../models');
  const society = await Society.findById(societyId).populate('managerIds adminContacts');
  if (!society) return;

  const adminManagerIds = [
    ...(society.managerIds || []),
    ...(society.adminContacts || [])
  ];

  for (const adminRef of adminManagerIds) {
    const adminId = typeof adminRef === 'string' ? adminRef : adminRef._id;
    if (adminId.toString() === fromUser._id.toString()) continue;

    const admin = await User.findById(adminId);
    if (!admin) continue;

    // Send push notification
    if (admin.fcmToken) {
      await NotificationService.sendMaintenancePaymentNotification(fromUser, admin._id, payment, admin.fcmToken);
    }

    // Send SMS
    if (process.env.SEND_MESSAGES === 'true' && admin.phoneNumber) {
      await SMSService.sendMaintenancePaymentSMS(payment, admin.phoneNumber);
    }
  }
}

/**
 * Notify the payee when their payment is approved/rejected
 */
async function notifyPayeeOfApproval(fromUser, payment, status) {
  if (!payment.recordedBy) return;

  const recordedByUserId = typeof payment.recordedBy === 'string' ? payment.recordedBy : payment.recordedBy._id;
  const payee = await User.findById(recordedByUserId);
  if (!payee) return;

  // Send push notification
  if (payee.fcmToken) {
    await NotificationService.sendMaintenanceApprovalNotification(fromUser, payee._id, payment, status, payee.fcmToken);
  }

  // Send SMS
  if (process.env.SEND_MESSAGES === 'true' && payee.phoneNumber) {
    await SMSService.sendMaintenanceApprovalSMS(payment, status, payee.phoneNumber);
  }
}
