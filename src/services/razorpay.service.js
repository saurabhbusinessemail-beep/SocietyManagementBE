const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpay;

setTimeout(() => {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}, 1000)



export const createOrder = async (params) => {
    try {
        const { orderId, amount, currency = 'INR', notes = {} } = params;

        if (!orderId || !amount) {
            throw new Error('orderId and amount are required');
        }

        const options = {
            amount: Math.ceil(amount),                  // amount in paise
            currency,
            receipt: orderId,        // your custom order ID
            notes: {
                orderId,            // store your order ID for reference
                ...notes
            },
            payment_capture: 1       // auto-capture payment
        };
        console.log('options = ', options)

        const order = await razorpay.orders.create(options);
        return order;  // contains order.id (Razorpay order ID), amount, etc.
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw error;
    }
};

export const verifyPaymentSignature = async (paymentData) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
        return { valid: false, payment: null };
    }

    // Optionally fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    return { valid: true, payment };
};

export const fetchPaymentById = async (paymentId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('Error fetching payment:', error);
        throw error;
    }
};

export const verifyWebhookSignature = (body, signature) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');
    return expectedSignature === signature;
};