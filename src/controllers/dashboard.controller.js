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

    const myFlats = await FlatMember.find({ userId, status: 'active' });
    const myFlatIds = myFlats.map((f) => f.flatId);
    const myFlatsAsOwner = myFlats.filter((f) => f.isOwner).map((f) => f.flatId);

    const approvals = {};

    // 1. Gate Entries
    const gateEntryFilter = { $or: [] };

    // As Owner/Tenant - See pending
    if (myFlatIds.length > 0) {
      gateEntryFilter.$or.push({
        flatId: { $in: myFlatIds },
        status: 'requested'
      });
    }

    // As Security - See pending and today's approved
    const securitySocietyIds = userSocieties
      .filter((s) => s.societyRoles.some((sr) => sr.name === 'security'))
      .map((s) => s.societyId);

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
      approvals.gateEntries = await GateEntry.find(gateEntryFilter)
        .sort({ updatedAt: -1 })
        .populate({
          path: 'flatId',
          populate: { path: 'buildingId' }
        })
        .populate('societyId')
        .limit(10);
    }

    // 2. Society Addition (Admin role)
    if (user.role === 'admin') {
      approvals.societies = await Society.find({
        isApproved: { $ne: true },
        isRejected: { $ne: true }
      }).limit(10);
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
      approvals.joinRequests = await ApprovalRequest.find(joinRequestFilter)
        .sort({ createdAt: -1 })
        .populate('societyId')
        .populate({
          path: 'flatId',
          populate: { path: 'buildingId' }
        })
        .limit(10);
    }

    // 4. Rent Payments
    if (myFlatsAsOwner.length > 0) {
      approvals.rentPayments = await RentPayment.find({
        flatId: { $in: myFlatsAsOwner },
        status: 'pending_approval'
      })
        .populate({
          path: 'flatId',
          populate: { path: 'buildingId' }
        })
        .populate('flatMemberId')
        .limit(10);
    }

    // 5. Maintenance Payments
    if (adminManagerSocietyIds.length > 0) {
      approvals.maintenancePayments = await MaintenancePayment.find({
        societyId: { $in: adminManagerSocietyIds },
        status: 'pending_approval'
      })
        .populate({
          path: 'flatId',
          populate: { path: 'buildingId' }
        })
        .populate('societyId')
        .limit(10);
    }

    // 6. Tenant Documents
    if (myFlatsAsOwner.length > 0) {
      approvals.tenantDocuments = await TenantDocument.find({
        flatId: { $in: myFlatsAsOwner },
        status: 'pending'
      })
        .populate({
          path: 'flatId',
          populate: { path: 'buildingId' }
        })
        .populate('tenantId')
        .limit(10);
    }

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
