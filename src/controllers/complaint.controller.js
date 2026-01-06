import { FlatMember } from '../models';
const complaintService = require('../services/complaint.service');

export const createComplaint = async (req, res, next) => {
  try {
    const data = await complaintService.createComplaint(req.body);
    res.json({ data, success: true });
  } catch (err) {
    next(err);
  }
};

export const deleteComplaint = async (req, res, next) => {
  try {
    const data = await complaintService.deleteComplaint(req.params.complaintId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const { societyId, flatId } = req.body;
    const logUsr = res.locals.user;
    const societies = res.locals.socities;
    const filteredSocities = !societyId
      ? societies
      : societies.filter((s) => s.societyId === societyId);
    const { page, limit } = req.query;
    let filter = {};

    // for admin get complaints only if societyid and/or flat id is sent
    if (logUsr.role === 'admin') {
      if (!societyId && !flatId) {
        return res.json({
          data: [],
          total: 0,
          page: 1,
          limit: 0,
          success: true
        });
      }
    }

    if (societyId) filter = { ...filter, societyId };
    if (flatId) filter = { ...filter, flatId };

    // filter societies for which I am manager of (add filter by societyId and/or flatId if sent in req.body)
    const myManagerSocietyIds = filteredSocities
      .filter((s) =>
        s.societyRoles.some((sr) =>
          ['societyadmin', 'manager'].includes(sr.name)
        )
      )
      .map((s) => s.societyId);

    // filter socities I am owner/member/tenant of (add filter by societyId and/or flatId if sent in req.body)
    const flatMembers = await FlatMember.find({ userId: logUsr._id });
    const flatMemberIds = flatMembers.map((fm) => fm.flatId.toString());
    const myMemberSocietyIds = filteredSocities
      .filter((s) =>
        s.societyRoles.some((sr) =>
          ['owner', 'member', 'tenant'].includes(sr.name)
        )
      )
      .map((s) => s.societyId);

    if (myManagerSocietyIds.length > 0) {
      filter = {
        ...filter,
        societyId: { $in: [...myManagerSocietyIds] }
      };
    }

    if (flatMemberIds && flatMemberIds.length > 0) {
      filter = {
        ...filter,
        flatId: { $in: flatMemberIds }
      };
    }

    console.log('\nfilter = ', filter);
    if (myManagerSocietyIds.length > 0 && flatMemberIds.length > 0) {
      filter = {
        $or: [
          { societyId: { ...filter.societyId } },
          { flatId: { ...filter.flatId } }
        ]
      };
    }
    console.log('filter = ', filter);

    const data = await complaintService.getComplaints(filter, {
      page: Number(page),
      limit: Number(limit)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.json({ success: false, message: 'No user found' });
    }

    const complaintId = req.params.complaintId;
    const { newStatus } = req.body;
    if (!newStatus) {
      return res.json({ success: false, message: 'No target status found' });
    }

    await complaintService.updateStatus(complaintId, newStatus, user._id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
