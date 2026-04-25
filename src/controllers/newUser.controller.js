import * as AuthService from '../services/auth.service';
import * as UserService from '../services/user.service';
import * as approvalService from '../services/approval.service';
import * as newUserService from '../services/newUser.service';
import { canAddDirectly } from '../services/flat.service';
import { isSocietyAdminOrManager } from '../services/society.service';
import * as NotificationService from '../services/notification.service';
import * as SMSService from '../services/sms.service';

export const newFlatMember = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    let flatMember = req.body;
    // If flat member is not a registered user then add user
    if (!flatMember.userId) {
      const newUser = {
        phoneNumber: flatMember.contact,
        name: flatMember.name
      };
      const newUserDoc = await UserService.findOrCreateUser(newUser);
      flatMember.userId = newUserDoc._id;
    }

    /* Check If loggedin user candirectly add this new member or need an approval for that */

    // Decision: can add directly or need approval?
    const direct = user.isAdmin || await canAddDirectly(user, flatMember);
    let result;
    if (direct) {
      // Directly create flat member
      const newMember = await newUserService.creatFlatMember(flatMember, user._id);
      result = { approved: true, createdRecord: newMember };
    } else {
      // Create pending approval request
      const approvalRequest = await approvalService.createApprovalRequest('FlatMember', flatMember, user);
      result = { approved: false, approvalRequest };
    }

    const updatedToken = await AuthService.getUserToken(user);
    if (result.approved) {
      res.status(201).json({
        success: true,
        message: 'Flat member added successfully',
        token: updatedToken,
        data: result.createdRecord
      });
    } else {
      // Notify approvers
      try {
        const approvers = await approvalService.getApproversForRequest('FlatMember', flatMember);
        for (const approver of approvers) {
          if (approver.fcmToken) {
            await NotificationService.sendApprovalRequestNotification(user, approver, 'FlatMember', result.approvalRequest, approver.fcmToken);
          }
          if (process.env.SEND_MESSAGES === 'true' && approver.phoneNumber) {
            await SMSService.sendApprovalRequestMessage('FlatMember', approver.phoneNumber);
          }
        }
      } catch (err) {
        console.error('Error sending approval notification/sms: ', err);
      }

      res.status(201).json({
        success: true,
        message: 'Flat member addition request submitted for approval',
        token: updatedToken,
        data: result.approvalRequest._id
      });
    }
  } catch (err) {
    next(err);
  }
};

export const newSecurity = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    let payload = { ...(req.body ?? {}) };
    // Ensure userId is set (the security guard's user ID, not the requester)
    if (!payload.userId) {
      const newUser = {
        phoneNumber: payload.contact,
        name: payload.name
      };
      const newUserDoc = await UserService.findOrCreateUser(newUser);
      payload.userId = newUserDoc._id;
    }
    payload.societyId = req.body.societyId; // must be provided

    // Decision: can add directly? Only society admin/manager can add security directly.
    const direct = user.isAdmin || await isSocietyAdminOrManager(user._id, payload.societyId);
    let result;
    if (direct) {
      // Directly create security record
      const security = await securityService.addSecurity(payload);
      result = { approved: true, createdRecord: security };
    } else {
      // Create pending approval request
      const approvalRequest = await approvalService.createApprovalRequest('Security', payload, user);
      result = { approved: false, approvalRequest };
    }

    const updatedToken = await AuthService.getUserToken(user);
    if (result.approved) {
      res.status(201).json({
        success: true,
        message: 'Security added successfully',
        token: updatedToken,
        security: result.createdRecord
      });
    } else {
      // Notify approvers
      try {
        const approvers = await approvalService.getApproversForRequest('Security', payload);
        for (const approver of approvers) {
          if (approver.fcmToken) {
            await NotificationService.sendApprovalRequestNotification(user, approver, 'Security', result.approvalRequest, approver.fcmToken);
          }
          if (process.env.SEND_MESSAGES === 'true' && approver.phoneNumber) {
            await SMSService.sendApprovalRequestMessage('Security', approver.phoneNumber);
          }
        }
      } catch (err) {
        console.error('Error sending approval notification/sms: ', err);
      }

      res.status(201).json({
        success: true,
        message: 'Security addition request submitted for approval',
        token: updatedToken,
        approvalRequestId: result.approvalRequest._id
      });
    }
  } catch (err) {
    next(err);
  }
};