export class SMS {
    async sendMessage(to, message) {
        throw new Error('sendMessage() must be implemented by subclass');
    }
}