import * as approvalService from '../services/approval.service';

export const getMyRequests = async (req, res, next) => {
    try {
        const user = res.locals.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'createdAt:desc',
            requestType: req.query.requestType,
            status: req.query.status || 'pending',
            flatNumber: req.query.flatNumber,
            societyName: req.query.societyName,
            requesterName: req.query.requesterName,
            requesterContact: req.query.requesterContact,
            securityPersonName: req.query.securityPersonName,
            securityPersonContact: req.query.securityPersonContact,
            search: req.query.search
        };

        const result = await approvalService.getRequestsByRequester(user._id, pagination);
        res.status(200).json(result);
    } catch (err) { next(err); }
};

export const getRequestsToApprove = async (req, res, next) => {
    try {
        const user = res.locals.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            sortBy: req.query.sortBy || 'createdAt:desc',
            requestType: req.query.requestType,
            status: req.query.status || 'pending',
            flatNumber: req.query.flatNumber,
            societyName: req.query.societyName,
            requesterName: req.query.requesterName,
            requesterContact: req.query.requesterContact,
            securityPersonName: req.query.securityPersonName,
            securityPersonContact: req.query.securityPersonContact,
            search: req.query.search
        };

        const result = await approvalService.getPendingRequestsForApprover(user, pagination);
        res.json(result);
    } catch (err) { next(err); }
};

export const getAllMyRequests = async (req, res, next) => {
    try {
        const user = res.locals.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        // Pagination & filters for "my requests" list
        const myPagination = {
            page: parseInt(req.query.myPage) || 1,
            limit: parseInt(req.query.myLimit) || 10,
            sortBy: req.query.mySortBy || 'createdAt:desc',
            requestType: req.query.myRequestType,
            status: req.query.status || 'pending',
            flatNumber: req.query.myFlatNumber,
            societyName: req.query.mySocietyName,
            requesterName: req.query.myRequesterName,
            requesterContact: req.query.myRequesterContact,
            securityPersonName: req.query.mySecurityPersonName,
            securityPersonContact: req.query.mySecurityPersonContact,
            search: req.query.mySearch
        };

        // Pagination & filters for "to approve" list
        const pendingPagination = {
            page: parseInt(req.query.pendingPage) || 1,
            limit: parseInt(req.query.pendingLimit) || 10,
            sortBy: req.query.pendingSortBy || 'createdAt:desc',
            requestType: req.query.pendingRequestType,
            status: req.query.status || 'pending',
            flatNumber: req.query.pendingFlatNumber,
            societyName: req.query.pendingSocietyName,
            requesterName: req.query.pendingRequesterName,
            requesterContact: req.query.pendingRequesterContact,
            securityPersonName: req.query.pendingSecurityPersonName,
            securityPersonContact: req.query.pendingSecurityPersonContact,
            search: req.query.pendingSearch
        };

        const data = await approvalService.getAllRelevantRequests(user, myPagination, pendingPagination);
        res.json({ success: true, ...data });
    } catch (err) { next(err); }
};

export const approveRequest = async (req, res, next) => {
    try {
        const user = res.locals.user;
        const { id } = req.params;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const result = await approvalService.approveApprovalRequest(id, user);
        res.json({ success: true, message: 'Request approved', createdRecord: result.createdRecord });
    } catch (err) { next(err); }
};

export const rejectRequest = async (req, res, next) => {
    try {
        const user = res.locals.user;
        const { id } = req.params;
        const { reason } = req.body;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        const request = await approvalService.rejectApprovalRequest(id, user, reason);
        res.json({ success: true, message: 'Request rejected', request });
    } catch (err) { next(err); }
};