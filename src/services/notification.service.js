import { Notification, User } from '../models';
const admin = require('../firebase/firebase');
const mongoose = require('mongoose');

export const sendGateEntryRequestNotification = async (fromUser, toUserId, gateEntry, fcmToken) => {
  const fromUserId = fromUser._id;
  const title = 'Gate Entry Request';
  const isRequested = gateEntry.status === 'requested';
  const type = isRequested ? 'GATE_PASS' : 'GENERAL';
  const message = isRequested ? `${gateEntry.visitorName} is requesting for gate entry` + (gateEntry.purpose ? ` for ${gateEntry.purpose}` : '.') : `${gateEntry.visitorName} has entered premises`;

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
  const title = 'Gate Entry Response';
  const type = 'GATE_PASS_RESPONSE';
  const message = `Flat member has ${gateEntry.status} gate entry request for ${gateEntry.visitorName}`;

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
  console.log('payload = ', payload);

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
  const title = 'Gate Exit';
  const type = 'GATE_EXIT';
  const message = `${gateEntry.visitorName} has exited the premises.`;

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
  console.log('payload = ', payload);

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
