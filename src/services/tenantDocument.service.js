import { TenantDocument, User, FlatMember, Flat } from '../models';
import * as NotificationService from './notification.service';
import * as SMSService from './sms.service';

export const createDocument = async (payload) => {
    const doc = await TenantDocument.create(payload);
    
    // Notify Owner
    // Find owner of the flat
    const owner = await FlatMember.findOne({ flatId: payload.flatId, isOwner: true, status: 'active' }).populate('userId');
    if (owner && owner.userId) {
        const ownerUser = owner.userId;
        if (ownerUser.fcmToken) {
            await NotificationService.sendTenantDocumentUploadNotification({ _id: payload.tenantId }, ownerUser._id, doc, ownerUser.fcmToken);
        }
        if (process.env.SEND_MESSAGES === 'true' && ownerUser.phoneNumber) {
            await SMSService.sendTenantDocumentUploadSMS(doc, ownerUser.phoneNumber);
        }
    }

    return doc;
};

export const getDocuments = async (filter, options = {}) => {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        TenantDocument.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('tenantId').populate('flatId').populate('flatMemberId'),
        TenantDocument.countDocuments(filter)
    ]);

    return { data, total, page, limit, success: true };
};

export const updateDocumentStatus = async (id, status, rejectionReason, approvedBy) => {
    const update = { status, approvedBy, approvedAt: new Date() };
    if (rejectionReason) update.rejectionReason = rejectionReason;

    const doc = await TenantDocument.findByIdAndUpdate(id, update, { new: true }).populate('tenantId');
    
    // Notify Tenant
    if (doc.tenantId) {
        const tenantUser = doc.tenantId;
        if (tenantUser.fcmToken) {
            await NotificationService.sendTenantDocumentResponseNotification({ _id: approvedBy }, tenantUser._id, doc, status, tenantUser.fcmToken);
        }
        if (process.env.SEND_MESSAGES === 'true' && tenantUser.phoneNumber) {
            await SMSService.sendTenantDocumentResponseSMS(doc, status, tenantUser.phoneNumber);
        }
    }

    return doc;
};

export const deleteDocument = async (id) => {
    return await TenantDocument.findByIdAndDelete(id);
};

export const sendReminder = async (fromUser, tenantId, flatId, societyId) => {
    const tenant = await User.findById(tenantId);
    const flat = await Flat.findById(flatId);
    
    const data = {
        flatNumber: flat.flatNumber,
        societyId,
        flatId
    };

    if (tenant.fcmToken) {
        await NotificationService.sendTenantDocumentReminderNotification(fromUser, tenantId, data, tenant.fcmToken);
    }
    if (process.env.SEND_MESSAGES === 'true' && tenant.phoneNumber) {
        await SMSService.sendTenantDocumentReminderSMS(data, tenant.phoneNumber);
    }
};

export const sendReminderToAll = async (fromUser, flatId, societyId) => {
    // Get all active tenants for the flat
    const activeTenants = await FlatMember.find({ 
        flatId, 
        isTenant: true, 
        status: 'active' 
    }).populate('userId');

    for (const tenantMember of activeTenants) {
        if (tenantMember.userId) {
            await sendReminder(fromUser, tenantMember.userId._id, flatId, societyId);
        }
    }
};

export const getDocumentStats = async (flatId) => {
    // Get active tenants for the flat
    const activeTenants = await FlatMember.find({ flatId, isTenant: true, status: 'active' });
    
    const tenantIds = activeTenants.map(t => t.userId);
    
    // For each tenant, check if they have any documents
    const documents = await TenantDocument.find({ flatId, tenantId: { $in: tenantIds } });
    
    const stats = activeTenants.map(tenant => {
        const tenantDocs = documents.filter(d => d.tenantId.toString() === tenant.userId.toString());
        return {
            tenantName: tenant.name,
            tenantId: tenant.userId,
            flatMemberId: tenant._id,
            submittedCount: tenantDocs.length,
            pendingApprovalCount: tenantDocs.filter(d => d.status === 'pending').length,
            approvedCount: tenantDocs.filter(d => d.status === 'approved').length,
            rejectedCount: tenantDocs.filter(d => d.status === 'rejected').length
        };
    });

    return stats;
};
