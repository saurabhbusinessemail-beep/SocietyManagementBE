// smsFactory.js
import { TwilioSMS } from './twilioSMS';
import { TextBeltSMS } from './textBeltSMS';

export const getSMSGateway = () => {
    const gateway = process.env.SMSGateway;
    if (!gateway) {
        throw new Error('SMSGateway environment variable is not set');
    }

    switch (gateway.toLowerCase()) {
        case 'twilio':
            return new TwilioSMS();
        case 'textbelt':
            return new TextBeltSMS();
        default:
            throw new Error(`Unsupported SMSGateway: ${gateway}. Use "Twilio" or "TextBelt".`);
    }
}
