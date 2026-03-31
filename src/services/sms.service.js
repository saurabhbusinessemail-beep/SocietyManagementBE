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