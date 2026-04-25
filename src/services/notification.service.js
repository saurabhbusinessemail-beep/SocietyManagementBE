import { Notification, User } from '../models';
import * as messageConfig from '../config/message.config';
const admin = require('../firebase/firebase');
const mongoose = require('mongoose');

export const sendOTPNotification = async (fromUser, toUserId, otp, fcmToken) => {
  const fromUserId = fromUser._id;
  const title = messageConfig.OTP.title;
  const type = messageConfig.OTP.type;
  const message = messageConfig.OTP.message(otp);

  const payload = {
    userId: toUserId,
    type,
    title,
    message,
    data: otp,
    triggeredByUserId: fromUserId,
    createdByUserId: fromUserId,
    createdOn: new Date()
  };

  const notificationData = await Notification.create(payload);
  if (fcmToken) {
    try {
      await sendNotificationToUser(fcmToken, title, message, { otp, type });
    } catch (err) {
      await Notification.findByIdAndDelete(notificationData._id);
      throw new Error('Could not send approval alert to user. A notification has been sent');
    }
  }
  return notificationData;
};

export const sendGateEntryRequestNotification = async (fromUser, toUserId, gateEntry, fcmToken) => {
  const fromUserId = fromUser._id;
  const title = messageConfig.GATE_ENTRY_REQUEST.title;
  const isRequested = gateEntry.status === 'requested';
  const type = isRequested ? messageConfig.GATE_ENTRY_REQUEST.type : messageConfig.GATE_ENTERED.type;
  const message = isRequested ? messageConfig.GATE_ENTRY_REQUEST.message(gateEntry) : messageConfig.GATE_ENTERED.message(gateEntry);

  const payload = {
    userId: toUserId,
    societyId: gateEntry.societyId,
    type,
    title,
    message,
    data: gateEntry,
    triggeredByUserId: fromUserId,
    createdByUserId: fromUserId,
    createdOn: new Date()
  };

  const notificationData = await Notification.create(payload);
  if (fcmToken) {
    try {
      await sendNotificationToUser(fcmToken, title, message, {
        notificationId: notificationData._id,
        gateEntryId: gateEntry._id,
        type
      });
    } catch (err) {
      await Notification.findByIdAndDelete(notificationData._id);
      throw new Error('Could not send approval alert to user. A notification has been sent');
    }
  }
  return notificationData;
};


export const resendNotification = async (type, dataId) => {
  const notifications = await Notification.find({
    type,
    'data._id': mongoose.Types.ObjectId(dataId)
  });
  if (!notifications || notifications.length === 0) return;

  for (let i = 0; i < notifications.length; i++) {
    const user = await User.findById(notifications[i].userId);
    if (!user || !user.fcmToken) continue;

    await sendNotificationToUser(user.fcmToken, notifications[i].title, notifications[i].message, {
      notificationId: notifications[i]._id,
      gateEntryId: dataId,
      type: notifications[i].type
    });
  }
};

export const sendGateEntryResponseNotification = async (fromUser, toUserId, gateEntry, fcmToken) => {
  const fromUserId = fromUser._id;
  const title = messageConfig.GATE_ENTRY_RESPONSE.title;
  const type = messageConfig.GATE_ENTRY_RESPONSE.type;
  const message = messageConfig.GATE_ENTRY_RESPONSE.message(gateEntry);

  const payload = {
    userId: toUserId,
    societyId: gateEntry.societyId,
    type,
    title,
    message,
    data: gateEntry,
    triggeredByUserId: fromUserId,
    createdByUserId: fromUserId,
    createdOn: new Date()
  };

  const notificationData = await Notification.create(payload);
  if (fcmToken) {
    try {
      await sendNotificationToUser(fcmToken, title, message, {
        notificationId: notificationData._id,
        gateEntryId: gateEntry._id,
        type
      });
    } catch (err) {
      await Notification.findByIdAndDelete(notificationData._id);
      throw new Error('Could not send approval alert to user. A notification has been sent');
    }
  }
  return notificationData;
};

export const sendGateExitNotification = async (fromUser, toUserId, gateEntry, fcmToken) => {
  const fromUserId = fromUser._id;
  const title = messageConfig.GATE_EXITED.title;
  const type = messageConfig.GATE_EXITED.type;
  const message = messageConfig.GATE_EXITED.message(gateEntry);

  const payload = {
    userId: toUserId,
    societyId: gateEntry.societyId,
    type,
    title,
    message,
    data: gateEntry,
    triggeredByUserId: fromUserId,
    createdByUserId: fromUserId,
    createdOn: new Date()
  };

  const notificationData = await Notification.create(payload);
  if (fcmToken) {
    try {
      await sendNotificationToUser(fcmToken, title, message, {
        notificationId: notificationData._id,
        gateEntryId: gateEntry._id,
        type
      });
    } catch (err) {
      await Notification.findByIdAndDelete(notificationData._id);
      throw new Error('Could not send approval alert to user. A notification has been sent');
    }
  }
  return notificationData;
};

export const sendApproveRejectSocietyNotification = async (fromUser, toUserId, society, fcmToken, isApproved) => {
  const fromUserId = fromUser._id;
  const title = isApproved ? messageConfig.SOCIETY_APPROVED.title : messageConfig.SOCIETY_REJECTED.title;
  const type = messageConfig.SOCIETY_APPROVED.type;
  const message = isApproved ? messageConfig.SOCIETY_APPROVED.message(society)
    : messageConfig.SOCIETY_REJECTED.message(society);

  const payload = {
    userId: toUserId,
    societyId: society._id,
    type,
    title,
    message,
    data: society,
    triggeredByUserId: fromUserId,
    createdByUserId: fromUserId,
    createdOn: new Date()
  };

  const notificationData = await Notification.create(payload);
  if (fcmToken) {
    try {
      await sendNotificationToUser(fcmToken, title, message, {
        notificationId: notificationData._id,
        gateEntryId: gateEntry._id,
        type
      });
    } catch (err) {
      await Notification.findByIdAndDelete(notificationData._id);
      throw new Error('Could not send approval alert to user. A notification has been sent');
    }
  }
  return notificationData;
}

export const sendApprovalRequestNotification = async (fromUser, toUser, requestType, approvalRequest, fcmToken) => {
  const fromUserId = fromUser._id;
  const title = messageConfig.APPROVAL_REQUEST.title;
  const type = messageConfig.APPROVAL_REQUEST.type;
  const message = messageConfig.APPROVAL_REQUEST.message(approvalRequest);

  const payload = {
    userId: toUser._id,
    societyId: approvalRequest.societyId,
    type,
    title,
    message,
    data: approvalRequest,
    triggeredByUserId: fromUserId,
    createdByUserId: fromUserId,
    createdOn: new Date()
  };

  const notificationData = await Notification.create(payload);
  if (fcmToken) {
    try {
      await sendNotificationToUser(fcmToken, title, message, {
        notificationId: notificationData._id,
        approvalRequestId: approvalRequest._id,
        type
      });
    } catch (err) {
      await Notification.findByIdAndDelete(notificationData._id);
      console.log('Could not send approval alert to user. A notification has been sent');
    }
  }
  return notificationData;
};

export const sendApprovalResponseNotification = async (fromUser, toUser, requestType, status, approvalRequest, fcmToken) => {
  const fromUserId = fromUser._id;
  const title = messageConfig.APPROVAL_RESPONSE.title;
  const type = messageConfig.APPROVAL_RESPONSE.type;
  const message = messageConfig.APPROVAL_RESPONSE.message(approvalRequest, status);

  const payload = {
    userId: toUser._id,
    societyId: approvalRequest.societyId,
    type,
    title,
    message,
    data: approvalRequest,
    triggeredByUserId: fromUserId,
    createdByUserId: fromUserId,
    createdOn: new Date()
  };

  const notificationData = await Notification.create(payload);
  if (fcmToken) {
    try {
      await sendNotificationToUser(fcmToken, title, message, {
        notificationId: notificationData._id,
        approvalRequestId: approvalRequest._id,
        type
      });
    } catch (err) {
      await Notification.findByIdAndDelete(notificationData._id);
      console.log('Could not send approval response alert to user. A notification has been sent');
    }
  }
  return notificationData;
};

/* FIREBASE Notification */
const sendNotificationToUser = async (fcmToken, title, body, data = {}) => {
  try {
    // Validate that fcmToken exists
    if (!fcmToken || fcmToken.trim() === '') {
      console.error('FCM Token is required but was empty or undefined');
      throw new Error('FCM Token is required');
    }

    // 2️⃣ Send Push via FCM
    const message = {
      token: fcmToken,
      notification: {
        title,
        body
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'high_priority_channel',
          sound: 'alert_sound', // 🔔 custom sound
          clickAction: 'OPEN_FROM_NOTIFICATION'
        }
      },
      apns: {
        // Add iOS configuration if needed
        payload: {
          aps: {
            sound: 'alert_sound.wav',
            badge: 1
          }
        }
      },
      data: {
        ...Object.entries(data).reduce((acc, [k, v]) => {
          acc[k] = String(v);
          return acc;
        }, {})
      }
    };

    console.log('Sending FCM message with token:', fcmToken);

    // Send the notification
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);

    return response;
  } catch (error) {
    console.error('Error sending notification:', error);

    // More specific error handling
    if (error.errorInfo) {
      console.error('Firebase error details:', error.errorInfo);

      // Handle specific Firebase errors
      if (error.errorInfo.code === 'messaging/invalid-registration-token' || error.errorInfo.code === 'messaging/registration-token-not-registered') {
        // Token is invalid or expired - you might want to remove it from your database
        console.error('Invalid or expired FCM token:', fcmToken);
      }
    }

    throw error;
  }
};
