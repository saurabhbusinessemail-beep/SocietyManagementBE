const twilio = require('twilio');
const { SMS } = require('./sms');

export class TwilioSMS extends SMS {
    constructor() {
        super();
        // Initialize Twilio client using environment variables
        this.client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    }

    async sendMessage(to, message) {
        if (!this.fromNumber) {
            throw new Error('TWILIO_PHONE_NUMBER is not set in environment');
        }
        try {
            const result = await this.client.messages.create({
                body: message,
                to: to,
                from: this.fromNumber,
            });
            return result;
        } catch (error) {
            throw new Error(`Twilio send failed: ${error.message}`);
        }
    }
}
