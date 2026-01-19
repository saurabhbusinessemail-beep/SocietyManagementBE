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
      } else {
        return res.json(await getAdminComplaints(req, res));
      }
    }

    const managerComplaints = await getManagetSocietyComplaint(req, res);
    const memberComplaints = await getMemberComplaints(req, res);
    const allData = mergeUniqueComplaints(
      managerComplaints.data,
      memberComplaints.data
    );

    res.json({
      data: allData,
      total: managerComplaints.total + memberComplaints.total,
      page: managerComplaints.page,
      limit: managerComplaints.limit,
      success: true
    });
  } catch (err) {
    next(err);
  }
};

const mergeUniqueComplaints = (arr1, arr2) => {
  const map = new Map();

  [...arr1, ...arr2].forEach((doc) => {
    map.set(doc._id.toString(), doc);
  });

  return Array.from(map.values());
};

const getAdminComplaints = async (req, res) => {
  let filter = req.body;
  const { page, limit } = req.query;

  const data = await complaintService.getComplaints(filter, {
    page: Number(page),
    limit: Number(limit)
  });
  return data;
};

const getManagetSocietyComplaint = async (req, res) => {
  let filter = {};
  const { page, limit } = req.query;
  const { societyId, flatId, complaintType } = req.body;
  const societies = res.locals.socities;

  const myManagerSocietyIds = societies
    .filter(
      (s) =>
        (!societyId || s.societyId === societyId) &&
        s.societyRoles.some((sr) =>
          ['societyadmin', 'manager'].includes(sr.name)
        )
    )
    .map((s) => s.societyId);

  if (flatId) filter.flatId = flatId;
  else if (myManagerSocietyIds.length > 0)
    filter.societyId = { $in: myManagerSocietyIds };
  else if (societyId) filter.societyId = societyId;

  if (complaintType) filter = { ...filter, complaintType };

  const data = await complaintService.getComplaints(filter, {
    page: Number(page),
    limit: Number(limit)
  });
  return data;
};

const getMemberComplaints = async (req, res) => {
  let filter = {};
  const logUsr = res.locals.user;
  const { page, limit } = req.query;
  const { societyId, flatId, complaintType } = req.body;
  const societies = res.locals.socities;

  const myMemberSocietyIds = societies
    .filter(
      (s) =>
        (!societyId || s.societyId === societyId) &&
        s.societyRoles.some((sr) =>
          ['owner', 'member', 'tenant'].includes(sr.name)
        )
    )
    .map((s) => s.societyId);

  if (flatId) {
    filter.flatId = flatId;
    if (complaintType) filter = { ...filter, complaintType };
  } else {
    // get my complaints
    // get public complaint of my socities

    const flatMembers = await FlatMember.find({
      userId: logUsr._id
    });
    const flatIds = flatMembers.map((fm) => fm.flatId.toString());

    filter = {
      $or: [
        // My own complaints (public + private)
        {
          flatId: { $in: flatIds }
        },

        // Other people's complaints, but ONLY public and ONLY in my member societies
        {
          createdByUserId: { $ne: logUsr._id },
          societyId: { $in: myMemberSocietyIds },
          complaintType: 'Public'
        }
      ]
    };

    if (societyId) {
      filter['$or'][0].societyId = societyId;
    }

    if (complaintType) {
      filter['$or'][0].complaintType = complaintType;
    }
  }

  const data = await complaintService.getComplaints(filter, {
    page: Number(page),
    limit: Number(limit)
  });
  return data;
};

export const changeStatus = async (req, res, next) => {
  try {
    const user = res.locals.user;
    const societies = res.locals.socities;

    if (!user) {
      return res.json({ success: false, message: 'No user found' });
    }

    const complaintId = req.params.complaintId;
    const { newStatus } = req.body;
    if (!newStatus) {
      return res.json({ success: false, message: 'No target status found' });
    }

    await complaintService.updateStatus(
      complaintId,
      newStatus,
      user._id,
      societies
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
