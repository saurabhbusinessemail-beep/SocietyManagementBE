const admin = require('firebase-admin');
import { fireBase } from './nestnet-105-firebase-adminsdk-fbsvc-65744390c1';

admin.initializeApp({
  credential: admin.credential.cert(fireBase)
});

module.exports = admin;
