const gateEntryService = require('../services/gateentry.service');
import * as FlatService from '../services/flat.service';
import * as UserService from '../services/user.service';
import * as NotificationService from '../services/notification.service';
import { FlatMember } from '../models';
import { getISTDayRange } from '../utils/other.util';

export const createGateEntry = async (req, res, next) => {
  try {
    const fromUser = res.locals.user;
    if (!fromUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    let gateEntry = req.body;
    const data = await gateEntryService.createGateEntry(gateEntry);

    // If status is requested then send notification to all flat members
    // rest all other stuses will be maintained in other functions with separate api calls
    if (gateEntry.status === 'requested') {
      await loopThroughGateEntryFlatMembers(data, fromUser, (toUserId, user) => {
        return NotificationService.sendGateEntryRequestNotification(fromUser, toUserId, data, user.fcmToken);
      });
    }
    res.status(201).json({ data, success: true });
  } catch (err) {
    next(err);
  }
};

export const getGateEntries = async (req, res, next) => {
  try {
    const { societyId, flatId, status, createdOn, exitPending = false } = req.body;
    const user = res.locals.user;
    const societies = res.locals.socities;
    const { page, limit } = req.query;

    if (!user) {
      return res.json({ success: false, message: 'No user found' });
    }

    // Member / Tenant / Owner Society Ids
    const mySecuritySocietyIds = societies.filter((s) => (!societyId || s.societyId === societyId) && s.societyRoles.some((sr) => ['security'].includes(sr.name))).map((s) => s.societyId);

    // My Flat Ids
    const flatMembers = await FlatMember.find({ userId: user._id });
    const myFlatIds = flatMembers.map((fm) => fm.flatId);

    // Create Filter
    let filter = { $and: [] };
    if (societyId) filter.$and.push({ societyId });
    if (flatId) filter.$and.push({ flatId });
    if (status) filter.$and.push({ status });
    if (exitPending) filter.$and.push({ $or: [{ exitTime: null }, { exitTime: { $exists: false } }] });
    if (createdOn) {
      const { start, end } = getISTDayRange(new Date(createdOn));

      filter.$and.push({ createdOn: { $gte: start, $lt: end } });
    }

    /* CHECK for USER ROLES and add filter for them */
    if (myFlatIds.length > 0 || mySecuritySocietyIds.length > 0) {
      let orCondition = { $or: [] };

      // for SECURITY add pendingGateEntryFilter
      if (mySecuritySocietyIds.length > 0 && !societyId) {
        orCondition.$or.push({
          $and: [{ createdByUserId: user._id }, { societyId: { $in: mySecuritySocietyIds } }]
        });
      }

      // for member/owner/tenant add userId filter
      if (myFlatIds.length > 0 && !flatId) {
        orCondition.$or.push({
          $and: [{ flatId: { $in: myFlatIds } }]
        });
      }

      if (orCondition.$or.length > 0) filter.$and.push(orCondition);
    }

    console.log('\n filter = ', JSON.stringify(filter));

    const data = await gateEntryService.getGateEntries(filter, {
      page: Number(page),
      limit: Number(limit)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getGateEntry = async (req, res, next) => {
  try {
    const data = await gateEntryService.gettGateEntry(req.params.gateEntryId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const markGateExit = async (req, res, next) => {
  const fromUser = res.locals.user;
  if (!fromUser) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const gateEntryId = req.params.gateEntryId;

  const data = await gateEntryService.updateGateExitTime(gateEntryId, fromUser._id);
  await loopThroughGateEntryFlatMembers(
    data,
    fromUser,
    (toUserId, user) => {
      return NotificationService.sendGateExitNotification(fromUser, toUserId, data, user.fcmToken);
    },
    true
  );
  res.json({ success: true, data });
};

export const updateGateEntryStatus = async (req, res, next) => {
  try {
    const fromUser = res.locals.user;

    if (!fromUser) {
      return res.json({ success: false, message: 'No user found' });
    }

    const gateEntryId = req.params.gateEntryId;
    const { newStatus } = req.body;

    if (!newStatus) {
      return res.json({ success: false, message: 'No target status found' });
    }

    const data = await gateEntryService.updateGateEntryStatus(gateEntryId, newStatus, fromUser._id);
    console.log('updating status notification for ', data);
    await loopThroughGateEntryFlatMembers(
      data,
      fromUser,
      (toUserId, user) => {
        return NotificationService.sendGateEntryResponseNotification(fromUser, toUserId, data, user.fcmToken);
      }
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const deleteGateEntry = async (req, res, next) => {
  try {
    const data = await gateEntryService.deleteGateEntry(req.params.gateEntryId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const resendGateEntryRequestNotification = async (req, res, next) => {
  try {
    const gateEntryId = req.params.gateEntryId;
    await NotificationService.resendNotification('GATE_PASS', gateEntryId);
    const data = await gateEntryService.updateGateEntryTime(gateEntryId);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const loopThroughGateEntryFlatMembers = async (gateEntry, fromUser, callBack, includeSecurity = false) => {
  const flatMembers = await FlatService.getFlatMembersByFlatId(gateEntry.flatId);
  const arrNotificationPromises = [];

  for (let i = 0; i < flatMembers.length; i++) {
    const toUserId = flatMembers[i].userId;
    if (toUserId === fromUser._id) continue;

    const user = await UserService.getUser(toUserId);
    if (!user || !user.fcmToken) continue;

    arrNotificationPromises.push(callBack(toUserId, user));
  }

  if (includeSecurity && gateEntry.createdByUserId !== fromUser._id) {
    console.log('sending notification to security ', gateEntry.createdByUserId);
    const user = await UserService.getUser(gateEntry.createdByUserId);
    arrNotificationPromises.push(callBack(gateEntry.createdByUserId, user));
  }

  if (arrNotificationPromises.length > 0) await Promise.all(arrNotificationPromises);
  else return new Error('No flat member found');
};
