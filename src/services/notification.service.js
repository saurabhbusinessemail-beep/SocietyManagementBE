import { Notification } from '../models';
const admin = require('../firebase/firebase');

export const sendGateEntryRequestNotification = async (
  fromUserId,
  toUserId,
  gateEntry,
  fcmToken
) => {
  const title = 'Gate Entry Request';
  const type = 'GATE_PASS'
  const message =
    `${gateEntry.visitorName} is requesting for gate entry` +
    (gateEntry.purpose ? ` for ${gateEntry.purpose}` : '.');

  const payload = {
    userId: toUserId,
    societyId: gateEntry.societyId,
    type,
    title,
    message,
    data: gateEntry,
    triggeredByUserId: fromUserId,
    craetedByUserId: fromUserId,
    createdOn: new Date()
  };

  const notificationData = await Notification.create(payload);
  await sendNotificationToUser(fcmToken, title, message, {
    notificationId: notificationData._id,
    gateEntryId: gateEntry._id, type
  });
  return notificationData;
};

export const sendGateEntryResponseNotification = (
  fromUser,
  toUser,
  gateEntry
) => {};

export const sentMessage = () => {};

const sendNotificationToUser = async ({ fcmToken, title, body, data = {} }) => {
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

    data: {
      ...Object.entries(data).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {})
    }
  };

  await admin.messaging().send(message);

  return notification;
};
