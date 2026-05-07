const { getSMSGateway } = require('../sms/smsFactory');
import * as messageConfig from '../config/message.config';

export const sendOTPMessage = async (otp, phoneNumber) => {
    const title = messageConfig.OTP.title;
    const message = messageConfig.OTP.message(otp);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        throw new Error(`Failed to send OTP: ${error.message}`);
    }
}

export const sendApprovalRequestMessage = async (approvalRequest, phoneNumber) => {
    const title = messageConfig.APPROVAL_REQUEST.title;
    const message = messageConfig.APPROVAL_REQUEST.message(approvalRequest);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Approval SMS: ${error.message}`);
    }
}

export const sendApprovalResponseMessage = async (approvalRequest, status, phoneNumber) => {
    const title = messageConfig.APPROVAL_RESPONSE.title;
    const message = messageConfig.APPROVAL_RESPONSE.message(approvalRequest, status);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Approval Response SMS: ${error.message}`);
    }
}

export const sendApproveRejectSocietyMessage = async (society, isApproved, phoneNumber) => {
    const title = isApproved ? messageConfig.SOCIETY_APPROVED.title : messageConfig.SOCIETY_REJECTED.title;
    const message = isApproved ? messageConfig.SOCIETY_APPROVED.message(society) : messageConfig.SOCIETY_REJECTED.message(society);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Society Approval/Rejection SMS: ${error.message}`);
    }
}

export const sendMaintenancePaymentSMS = async (payment, phoneNumber) => {
    const title = messageConfig.MAINTENANCE_PAYMENT_REQUEST.title;
    const message = messageConfig.MAINTENANCE_PAYMENT_REQUEST.message(payment);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Maintenance Payment SMS: ${error.message}`);
    }
}

export const sendMaintenanceApprovalSMS = async (payment, status, phoneNumber) => {
    const title = messageConfig.MAINTENANCE_PAYMENT_RESPONSE.title;
    const message = messageConfig.MAINTENANCE_PAYMENT_RESPONSE.message(payment, status);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Maintenance Approval SMS: ${error.message}`);
    }
}

export const sendMaintenanceReminderSMS = async (data, phoneNumber) => {
    const title = messageConfig.MAINTENANCE_REMINDER.title;
    const message = messageConfig.MAINTENANCE_REMINDER.message(data);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Maintenance Reminder SMS: ${error.message}`);
    }
}

export const sendRentPaymentSMS = async (payment, phoneNumber) => {
    const title = messageConfig.RENT_PAYMENT_REQUEST.title;
    const message = messageConfig.RENT_PAYMENT_REQUEST.message(payment);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Rent Payment SMS: ${error.message}`);
    }
}

export const sendRentApprovalSMS = async (payment, status, phoneNumber) => {
    const title = messageConfig.RENT_PAYMENT_RESPONSE.title;
    const message = messageConfig.RENT_PAYMENT_RESPONSE.message(payment, status);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Rent Approval SMS: ${error.message}`);
    }
}

export const sendRentReminderSMS = async (data, phoneNumber) => {
    const title = messageConfig.RENT_REMINDER.title;
    const message = messageConfig.RENT_REMINDER.message(data);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Rent Reminder SMS: ${error.message}`);
    }
}

export const sendTenantDocumentUploadSMS = async (doc, phoneNumber) => {
    const title = messageConfig.TENANT_DOCUMENT_UPLOAD.title;
    const message = messageConfig.TENANT_DOCUMENT_UPLOAD.message(doc);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Tenant Document Upload SMS: ${error.message}`);
    }
}

export const sendTenantDocumentResponseSMS = async (doc, status, phoneNumber) => {
    const title = messageConfig.TENANT_DOCUMENT_RESPONSE.title;
    const message = messageConfig.TENANT_DOCUMENT_RESPONSE.message(doc, status);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Tenant Document Response SMS: ${error.message}`);
    }
}

export const sendTenantDocumentReminderSMS = async (data, phoneNumber) => {
    const title = messageConfig.TENANT_DOCUMENT_REMINDER.title;
    const message = messageConfig.TENANT_DOCUMENT_REMINDER.message(data);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Tenant Document Reminder SMS: ${error.message}`);
    }
}

export const sendRoleAssignedSMS = async (role, societyName, phoneNumber) => {
    const title = messageConfig.ROLE_ASSIGNED.title;
    const message = messageConfig.ROLE_ASSIGNED.message(role, societyName);
    const fullMessage = `${title}\n${message}`;
    const smsGateway = getSMSGateway();
    try {
        const result = await smsGateway.sendMessage(phoneNumber, fullMessage);
        return result;
    } catch (error) {
        console.log(`Failed to send Role Assigned SMS: ${error.message}`);
    }
}