const { isSocietyAdminOrManager } = require('./society.service');
const mongoose = require('mongoose');
import { ApprovalRequest, FlatMember, Security } from '../models';
const { creatFlatMember } = require('./newUser.service');

function buildRequesterPipeline(filters) {
    const { userId, requestType, status, flatNumber, societyName, requesterName, requesterContact, securityPersonName, securityPersonContact, search } = filters;
    const pipeline = [];

    // Match by requestedBy (userId is string, but field is ObjectId)
    if (userId) {
        pipeline.push({
            $match: {
                requestedBy: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Match by requestType
    if (requestType) pipeline.push({ $match: { requestType } });

    // Match by status (default 'pending')
    if (status) pipeline.push({ $match: { status } });
    else pipeline.push({ $match: { status: 'pending' } });

    // Lookup requester user details
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'requestedBy',
            foreignField: '_id',
            as: 'requester'
        }
    });
    pipeline.push({ $unwind: { path: '$requester', preserveNullAndEmptyArrays: true } });

    // Lookup society details
    pipeline.push({
        $lookup: {
            from: 'societies',
            localField: 'societyId',
            foreignField: '_id',
            as: 'society'
        }
    });
    pipeline.push({ $unwind: { path: '$society', preserveNullAndEmptyArrays: true } });

    // For FlatMember requests, lookup flat details using data.flatId (ObjectId)
    // This works even if requestType is Security (flat will be null)
    pipeline.push({
        $lookup: {
            from: 'flats',
            localField: 'flatId',
            foreignField: '_id',
            as: 'flat'
        }
    });
    pipeline.push({ $unwind: { path: '$flat', preserveNullAndEmptyArrays: true } });

    // Add computed fields based on requestType
    pipeline.push({
        $addFields: {
            requesterName: '$requester.name',
            requesterContact: '$requester.phoneNumber',
            societyName: '$society.societyName',
            flatNumber: {
                $cond: {
                    if: { $eq: ['$requestType', 'FlatMember'] },
                    then: '$flat.flatNumber',
                    else: null
                }
            },
            securityPersonName: {
                $cond: {
                    if: { $eq: ['$requestType', 'Security'] },
                    then: '$data.name',
                    else: null
                }
            },
            securityPersonContact: {
                $cond: {
                    if: { $eq: ['$requestType', 'Security'] },
                    then: '$data.contact',
                    else: null
                }
            }
        }
    });

    // Apply additional filters
    const matchStage = {};
    if (flatNumber) matchStage.flatNumber = { $regex: flatNumber, $options: 'i' };
    if (societyName) matchStage.societyName = { $regex: societyName, $options: 'i' };
    if (requesterName) matchStage.requesterName = { $regex: requesterName, $options: 'i' };
    if (requesterContact) matchStage.requesterContact = { $regex: requesterContact, $options: 'i' };
    if (securityPersonName) matchStage.securityPersonName = { $regex: securityPersonName, $options: 'i' };
    if (securityPersonContact) matchStage.securityPersonContact = { $regex: securityPersonContact, $options: 'i' };

    if (search) {
        matchStage.$or = [
            { requesterName: { $regex: search, $options: 'i' } },
            { requesterContact: { $regex: search, $options: 'i' } },
            { societyName: { $regex: search, $options: 'i' } },
            { flatNumber: { $regex: search, $options: 'i' } },
            { securityPersonName: { $regex: search, $options: 'i' } },
            { securityPersonContact: { $regex: search, $options: 'i' } }
        ];
    }

    if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage });

    return pipeline;
}


// Helper: check if user can approve a request (used in approve/reject)
async function canApprove(approver, requestType, requestData) {
    if (requestType === 'FlatMember') {
        const { flatId, isOwner, isTenant, isMember, isTenantMember, societyId } = requestData;

        const flatOwner = await FlatMember.findOne({ flatId, isOwner: true, status: 'active' }).populate('userId');
        const flatTenant = await FlatMember.findOne({ flatId, isTenant: true, status: 'active' }).populate('userId');

        const isApproverOwner = flatOwner && flatOwner.userId._id.toString() === approver._id.toString();
        const isApproverTenant = flatTenant && flatTenant.userId._id.toString() === approver._id.toString();

        if (isOwner) {
            return await isSocietyAdminOrManager(approver._id, societyId);
        }
        if (isTenant || isMember) {
            return isApproverOwner;
        }
        if (isTenantMember) {
            return isApproverOwner || isApproverTenant;
        }
        return false;
    }
    else if (requestType === 'Security') {
        // Only society admin/manager can approve security requests
        return await isSocietyAdminOrManager(approver._id, requestData.societyId);
    }
    return false;
}

// Helper: check society admin (implement based on your role system)
async function isSocietyAdmin(userId, societyId) {
    // Example: check a SocietyAdmin collection
    const SocietyAdmin = require('../models/SocietyAdmin');
    const admin = await SocietyAdmin.findOne({ userId, societyId, status: 'active' });
    return !!admin;
}

/**
 * Create a pending approval request (no auto‑approval).
 */
async function createApprovalRequest(requestType, data, requestedBy) {
    if (!requestType || !data || !requestedBy) throw new Error('Missing required parameters');
    if (!data.societyId) throw new Error('societyId is required');

    const approvalRequest = await ApprovalRequest.create({
        requestType,
        data,
        requestedBy: requestedBy._id,
        societyId: data.societyId,
        flatId: requestType === 'FlatMember' ? data.flatId : undefined,
        status: 'pending'
    });
    return approvalRequest;
}

/**
 * Approve a pending request.
 */
async function approveApprovalRequest(requestId, approverUser) {
    const request = await ApprovalRequest.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request already processed');

    const authorized = await canApprove(approverUser, request.requestType, request.data);
    if (!authorized) throw new Error('You are not authorized to approve this request');

    let actualRecord;
    if (request.requestType === 'FlatMember') {
        actualRecord = await creatFlatMember(request.data);
    } else if (request.requestType === 'Security') {
        actualRecord = await Security.create(request.data);
    } else {
        throw new Error('Invalid request type');
    }

    request.status = 'approved';
    request.approvedBy = approverUser._id;
    await request.save();

    return { approvalRequest: request, createdRecord: actualRecord };
}

/**
 * Reject a pending request.
 */
async function rejectApprovalRequest(requestId, approverUser, reason = null) {
    const request = await ApprovalRequest.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request already processed');

    const authorized = await canApprove(approverUser, request.requestType, request.data);
    if (!authorized) throw new Error('You are not authorized to reject this request');

    request.status = 'rejected';
    request.approvedBy = approverUser._id;
    request.rejectionReason = reason;
    await request.save();

    return request;
}

/**
 * Get requests created by a user (paginated).
 */
async function getRequestsByRequester(userId, pagination) {
    const { page = 1, limit = 10, sortBy = 'createdAt:desc', requestType, status, flatNumber, societyName, requesterName, requesterContact, securityPersonName, securityPersonContact, search } = pagination;
    const skip = (page - 1) * limit;

    const pipeline = buildRequesterPipeline({
        userId,
        requestType,
        status: status || 'pending',
        flatNumber,
        societyName,
        requesterName,
        requesterContact,
        securityPersonName,
        securityPersonContact,
        search
    });

    // Add sorting
    const [field, order] = sortBy.split(':');
    const sortOrder = order === 'asc' ? 1 : -1;
    pipeline.push({ $sort: { [field]: sortOrder } });

    // Add pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    pipeline.push({ $skip: skip }, { $limit: limit });

    const [data, totalResult] = await Promise.all([
        ApprovalRequest.aggregate(pipeline),
        ApprovalRequest.aggregate(countPipeline)
    ]);

    const total = totalResult.length ? totalResult[0].total : 0;
    return {
        success: true,
        data,
        total,
        page,
        limit
    };
}

/**
 * Get pending requests that the user can approve (paginated).
 */
async function getPendingRequestsForApprover(user, pagination) {
    const { page = 1, limit = 10, sortBy = 'createdAt:desc', requestType, status, flatNumber, societyName, requesterName, requesterContact, securityPersonName, securityPersonContact, search } = pagination;

    // Use the same pipeline but without userId, and force status = 'pending' if not overridden
    const pipeline = buildRequesterPipeline({
        requestType,
        status: status || 'pending',
        flatNumber,
        societyName,
        requesterName,
        requesterContact,
        securityPersonName,
        securityPersonContact,
        search
    });

    const allPending = await ApprovalRequest.aggregate(pipeline);
    // Filter by canApprove (in memory)
    const authorised = [];
    for (const req of allPending) {
        if (await canApprove(user, req.requestType, req.data)) {
            authorised.push(req);
        }
    }

    // Sort
    const [field, order] = sortBy.split(':');
    const sortOrder = order === 'asc' ? 1 : -1;
    authorised.sort((a, b) => (a[field] > b[field] ? sortOrder : -sortOrder));

    // Paginate
    const total = authorised.length;
    const skip = (page - 1) * limit;
    const paginated = authorised.slice(skip, skip + limit);

    return {
        success: true,
        data: paginated,
        total,
        page,
        limit
    };
}

/**
 * Get both requester's own requests and pending approvable requests (paginated).
 * Accept separate page/limit for each list.
 */
async function getAllRelevantRequests(user, myPagination, pendingPagination) {
    const [myRequests, toApprove] = await Promise.all([
        getRequestsByRequester(user._id, myPagination),
        getPendingRequestsForApprover(user, pendingPagination)
    ]);
    return { myRequests, toApprove };
}

module.exports = {
    createApprovalRequest,
    approveApprovalRequest,
    rejectApprovalRequest,
    getRequestsByRequester,
    getPendingRequestsForApprover,
    getAllRelevantRequests,
    canApprove,
    isSocietyAdmin
};