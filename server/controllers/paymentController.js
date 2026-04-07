const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');

const razorpay = new Razorpay({
    key_id: (process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyIdHere').trim(),
    key_secret: (process.env.RAZORPAY_KEY_SECRET || 'YourKeySecretHere').trim()
});

const createCheckoutSession = async (req, res) => {
    try {
        const userId = req.user._id;

        const options = {
            amount: 110000, // 1INR in paise
            currency: 'INR',
            receipt: `receipt_order_${userId}`
        };

        const order = await razorpay.orders.create(options);

        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyIdHere'
        });
    } catch (error) {
        console.error('Razorpay Error Details:', {
            message: error.message,
            statusCode: error.statusCode,
            description: error.description,
            metadata: error.metadata
        });
        res.status(500).json({ 
            message: 'Razorpay order creation failed', 
            error: error.message,
            details: error.description || 'Check server logs for more details'
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'YourKeySecretHere')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            const userId = req.user._id;
            const user = await User.findById(userId);
            if (user) {
                user.subscriptionTier = 'Gold';
                user.isVerified = true;
                await user.save();

                // Create Transaction record
                await Transaction.create({
                    user: userId,
                    razorpay_order_id,
                    razorpay_payment_id,
                    amount: 1100, // Since we hardcoded 100 paise
                    currency: 'INR',
                    status: 'Success',
                    plan: 'Gold'
                });

                const userObj = user.toObject();
                delete userObj.password;

                return res.json({ success: true, message: 'Payment verified and profile upgraded to Premium', user: userObj });
            }
        }
        res.status(400).json({ success: false, message: 'Payment verification failed' });
    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createCheckoutSession,
    verifyPayment
};
