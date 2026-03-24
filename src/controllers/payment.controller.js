const { createOrder, verifyPaymentSignature, verifyWebhookSignature } = require('../services/razorpay.service');
import { updatePaymentStatus } from '../services/pricingPlan.service'

/**
 * Create order endpoint
 * POST /api/payment/create-order
 * Body: { orderId: string, amount: number, currency?: string, notes?: object }
 */
export const createOrderController = async (req, res) => {
    try {
        const { orderId, amount, currency, notes } = req.body;
        const order = await createOrder({ orderId, amount, currency, notes });

        res.json({
            success: true,
            orderId: order.id,           // Razorpay order ID
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt       // your original orderId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify payment endpoint
 * POST /api/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, your_order_id? }
 */
export const verifyPaymentController = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, your_order_id } = req.body;

        const { valid, payment } = await verifyPaymentSignature({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        if (!valid) {
            return res.status(400).json({ success: false, error: 'Invalid payment signature' });
        }

        // Here you can update your database with payment.status, payment.method, etc.
        // Use your_order_id if passed from frontend

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                orderId: your_order_id,
                razorpayOrderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                email: payment.email,
                contact: payment.contact
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Webhook endpoint for async events
 * POST /api/payment/webhook
 */
export const webhookController = async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = verifyWebhookSignature(req.body, signature);

    if (!isValid) {
        return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle events based on event type
    switch (event) {
        case 'payment.captured':
            // Payment successful – update your DB, send email, etc.
            console.log('Payment captured:', payload.payment.entity.notes.orderId);
            updatePaymentStatus(payload.payment.entity.notes.orderId, 'paid', payload.payment.entity)
            break;
        case 'payment.failed':
            console.log('Payment failed:', payload.payment.entity.notes.orderId);
            updatePaymentStatus(payload.payment.entity.notes.orderId, 'failed', payload.payment.entity)
            break;
        case 'refund.created':
            console.log('Refund created:', payload.refund.entity);
            break;
        // add other events as needed
        default:
            console.log('Unhandled event:', event);
    }

    res.status(200).json({ status: 'ok' });
};