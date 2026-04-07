import { useAuthStore } from '../store/useAuthStore';
import { paymentService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export const useUpgrade = () => {
    const { user: currentUser, isAuthenticated, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const handleUpgrade = async () => {
        if (!isAuthenticated || !currentUser) {
            navigate('/login');
            return;
        }

        try {
            const res = await paymentService.createCheckoutSession();

            const options = {
                key: res.key,
                amount: res.amount,
                currency: res.currency,
                name: "Shubh Vivah Matrimony",
                description: "Premium Membership",
                order_id: res.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await paymentService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.success) {
                            updateUser({ subscriptionTier: 'Gold' });
                            alert('Payment Successful! You are now a Premium Member.');
                            queryClient.invalidateQueries();
                        }
                    } catch (err) {
                        console.error('Payment verification failed', err);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: currentUser.fullName,
                    email: currentUser.email || ""
                },
                theme: {
                    color: "#db2777"
                }
            };

            // @ts-ignore
            if (window.Razorpay) {
                // @ts-ignore
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response: any) {
                    console.error(response.error);
                    alert('Payment failed');
                });
                rzp.open();
            } else {
                alert('Payment gateway not loaded. Please try again later.');
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            const errMsg = error.response?.data?.message || error.response?.data?.error || 'Could not initiate checkout';
            alert(`${errMsg}. Please try again later.`);
        }
    };

    return { handleUpgrade };
};
