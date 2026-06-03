import { GateEntry, Society, ApprovalRequest, RentPayment, MaintenancePayment, TenantDocument, FlatMember } from '../models';
import { getISTDayRange } from '../utils/other.util';

/**
 * Get all pending approvals for the current user across different categories
 */
export const getPendingApprovals = async (req, res, next) => {
  try {
    const user = res.locals.user;
    const userSocieties = res.locals.socities || [];
    const userId = user._id;

    const myFlats = await FlatMember.find({ userId, status: { $nin: ['expired', 'terminated'] } });
    const myFlatIds = myFlats.map((f) => f.flatId);
    const myFlatsAsOwner = myFlats.filter((f) => f.isOwner).map((f) => f.flatId);


    // 1. Gate Entries
    const gateEntryFilter = { $or: [] };

    // As Owner/Tenant - See pending
    if (myFlatIds.length > 0) {
      gateEntryFilter.$or.push({
        flatId: { $in: myFlatIds },
        status: 'requested'
      });
    }

    // Build all query conditions upfront, then run in parallel
    const securitySocietyIds = userSocieties
      .filter((s) => s.societyRoles.some((sr) => sr.name === 'security'))
      .map((s) => s.societyId);

    // --- Build queries ---
    const queries = {};

    if (securitySocietyIds.length > 0) {
      const { start, end } = getISTDayRange(new Date());
      gateEntryFilter.$or.push({
        societyId: { $in: securitySocietyIds },
        $or: [
          { status: 'requested' },
          { status: 'approved', updatedAt: { $gte: start, $lt: end } }
        ]
      });
    }
    if (gateEntryFilter.$or.length > 0) {
      queries.gateEntries = GateEntry.find(gateEntryFilter)
        .sort({ updatedAt: -1 })
        .populate({
          path: 'flatId',
          select: 'flatNumber floor buildingId',
          populate: { path: 'buildingId', select: 'buildingNumber' }
        })
        .populate('societyId', 'societyName')
        .limit(10)
        .lean();
    }

    // 2. Society Addition (Admin role)
    if (user.role === 'admin') {
      queries.societies = Society.find({
        isApproved: false,
        $or: [{ isRejected: false }, { isRejected: { $exists: false } }]
      }).select('societyName address').limit(10).lean();
    }

    // 3. Join Requests (ApprovalRequest)
    const joinRequestFilter = { status: 'pending', $or: [] };

    // As Society Admin/Manager
    const adminManagerSocietyIds = userSocieties
      .filter((s) =>
        s.societyRoles.some((sr) => ['societyadmin', 'manager'].includes(sr.name))
      )
      .map((s) => s.societyId);

    if (adminManagerSocietyIds.length > 0) {
      joinRequestFilter.$or.push({
        societyId: { $in: adminManagerSocietyIds },
        requestType: { $in: ['FlatMember', 'Security'] }
      });
    }

    // As Flat Owner (for tenants joining)
    if (myFlatsAsOwner.length > 0) {
      joinRequestFilter.$or.push({
        flatId: { $in: myFlatsAsOwner },
        requestType: 'FlatMember',
        'data.isTenant': true
      });
    }

    if (joinRequestFilter.$or.length > 0) {
      queries.joinRequests = ApprovalRequest.find(joinRequestFilter)
        .sort({ createdAt: -1 })
        .populate('societyId', 'societyName')
        .populate({ path: 'flatId', select: 'flatNumber floor buildingId', populate: { path: 'buildingId', select: 'buildingNumber' } })
        .limit(10)
        .lean();
    }

    // 4. Rent Payments
    if (myFlatsAsOwner.length > 0) {
      queries.rentPayments = RentPayment.find({
        flatId: { $in: myFlatsAsOwner },
        status: 'pending_approval'
      })
        .populate({ path: 'flatId', select: 'flatNumber floor buildingId', populate: { path: 'buildingId', select: 'buildingNumber' } })
        .populate('flatMemberId', 'name contact isTenant')
        .limit(10)
        .lean();
    }

    // 5. Maintenance Payments
    if (adminManagerSocietyIds.length > 0) {
      queries.maintenancePayments = MaintenancePayment.find({
        societyId: { $in: adminManagerSocietyIds },
        status: 'pending_approval'
      })
        .populate({ path: 'flatId', select: 'flatNumber floor buildingId', populate: { path: 'buildingId', select: 'buildingNumber' } })
        .populate('societyId', 'societyName')
        .limit(10)
        .lean();
    }

    // 6. Tenant Documents
    if (myFlatsAsOwner.length > 0) {
      queries.tenantDocuments = TenantDocument.find({
        flatId: { $in: myFlatsAsOwner },
        status: 'pending'
      })
        .populate({ path: 'flatId', select: 'flatNumber floor buildingId', populate: { path: 'buildingId', select: 'buildingNumber' } })
        .populate('tenantId', 'name phoneNumber')
        .limit(10)
        .lean();
    }

    // --- Fire ALL queries in parallel ---
    const queryKeys = Object.keys(queries);
    const queryResults = await Promise.all(queryKeys.map(k => queries[k]));

    const approvals = {};
    queryKeys.forEach((key, i) => { approvals[key] = queryResults[i]; });

    // Filter out empty categories
    const result = {};
    for (const key in approvals) {
      if (approvals[key] && approvals[key].length > 0) {
        result[key] = approvals[key];
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
