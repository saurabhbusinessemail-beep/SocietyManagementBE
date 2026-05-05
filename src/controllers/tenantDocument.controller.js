import mongoose from 'mongoose';
import * as tenantDocumentService from '../services/tenantDocument.service';

export const createDocument = async (req, res, next) => {
    try {
        const { flatMemberId } = req.body;
        if (!flatMemberId || !mongoose.Types.ObjectId.isValid(flatMemberId)) {
            return res.status(400).json({ success: false, message: 'Valid flatMemberId is required' });
        }
        const payload = {
            ...req.body,
            tenantId: res.locals.user._id
        };
        const data = await tenantDocumentService.createDocument(payload);
        res.status(201).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

export const getDocuments = async (req, res, next) => {
    try {
        const filter = req.query.filter ? JSON.parse(req.query.filter) : {};
        const { page, limit } = req.query;
        const data = await tenantDocumentService.getDocuments(filter, {
            page: Number(page),
            limit: Number(limit)
        });
        res.json(data);
    } catch (err) {
        next(err);
    }
};

export const updateDocumentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        const approvedBy = res.locals.user._id;
        const data = await tenantDocumentService.updateDocumentStatus(id, status, rejectionReason, approvedBy);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

export const deleteDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        await tenantDocumentService.deleteDocument(id);
        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (err) {
        next(err);
    }
};

export const sendReminder = async (req, res, next) => {
    try {
        const { tenantId, flatId, societyId } = req.body;
        const fromUser = res.locals.user;
        await tenantDocumentService.sendReminder(fromUser, tenantId, flatId, societyId);
        res.json({ success: true, message: 'Reminder sent successfully' });
    } catch (err) {
        next(err);
    }
};

export const sendReminderToAll = async (req, res, next) => {
    try {
        const { flatId, societyId } = req.body;
        const fromUser = res.locals.user;
        await tenantDocumentService.sendReminderToAll(fromUser, flatId, societyId);
        res.json({ success: true, message: 'Reminders sent to all tenants' });
    } catch (err) {
        next(err);
    }
};

export const getDocumentStats = async (req, res, next) => {
    try {
        const { flatId } = req.params;
        const data = await tenantDocumentService.getDocumentStats(flatId);
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};
