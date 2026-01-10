const gateEntryService = require('../services/gateentry.service');
import * as FlatService from '../services/flat.service';
import * as NotificationService from '../services/notification.service';

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
      const flatMembers = await FlatService.getFlatMembersByFlatId(
        gateEntry.flatId
      );
      const arrNotificationPromises = flatMembers.map((fm) => {
        const toUser = fm.userId;
        return NotificationService.sendGateEntryRequestNotification(
          fromUser,
          toUser,
          gateEntry
        );
      });

      if (arrNotificationPromises.length > 0)
        await Promise.all(arrNotificationPromises);
      else return res.status(404).json({ message: 'No flat member found' });

      // pending implementation
    }
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const getGateEntries = async (req, res, next) => {
  try {
    const societyId = req.params.societyId;
    const flatId = req.params.flatId;
    let filter = {};
    if (societyId) filter.societyId = societyId;
    if (flatId) filter.flatId = flatId;

    const { page, limit } = req.query;
    const data = await gateEntryService.getGateEntryes(filter, {
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
    const data = await gateEntryService.gettGateEntry(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateGateEntryStatus = async (req, res, next) => {
  try {
    const user = res.locals.user;

    if (!user) {
      return res.json({ success: false, message: 'No user found' });
    }

    const gateEntryId = req.params.id;
    const { newStatus } = req.body;
    if (!newStatus) {
      return res.json({ success: false, message: 'No target status found' });
    }

    await gateEntryService.updateGateEntryStatus(
      gateEntryId,
      newStatus,
      user._id
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const deleteGateEntry = async (req, res, next) => {
  try {
    const data = await gateEntryService.deleteGateEntry(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
