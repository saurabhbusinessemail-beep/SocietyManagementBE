import * as AuthService from '../services/auth.service';
import * as UserService from '../services/user.service';
import * as approvalService from '../services/approval.service';
import * as newUserService from '../services/newUser.service';
import { canAddDirectly } from '../services/flat.service';
import { isSocietyAdminOrManager } from '../services/society.service';

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
    const direct = await canAddDirectly(user, flatMember);
    let result;
    if (direct) {
      // Directly create flat member
      const newMember = await newUserService.creatFlatMember(flatMember);
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

    let payload = req.body;
    // Ensure userId is set (the security guard's user ID, not the requester)
    if (!payload.userId) {
      // If not provided, you might want to create a new user or throw error
      return res.status(400).json({ message: 'userId for security guard is required' });
    }
    payload.societyId = req.body.societyId; // must be provided

    // Decision: can add directly? Only society admin/manager can add security directly.
    const direct = await isSocietyAdminOrManager(user._id, payload.societyId);
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