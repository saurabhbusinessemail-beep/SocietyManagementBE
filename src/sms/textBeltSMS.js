const { SMS } = require('./sms');
// const fetch = require('node-fetch'); // or use native fetch in Node 18+

export class TextBeltSMS extends SMS {
    constructor() {
        super();
        this.apiKey = process.env.TEXTBELT_API_KEY;
        if (!this.apiKey) {
            throw new Error('TEXTBELT_API_KEY is not set in environment');
        }
    }

    async sendMessage(to, message) {
        const url = 'https://textbelt.com/text';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: to,
                message: message,
                key: this.apiKey,
            }),
        });
        const data = await response.json();

        if (!data.success) {
            throw new Error(`TextBelt send failed: ${data.error || 'Unknown error'}`);
        }
        return data;
    }
}
