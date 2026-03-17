import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Heart, Mail, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

export const VerifyEmailPage = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { verifyEmailCode, user } = useAuthStore();

    const email = location.state?.email || '';

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const otp = code.join('');
        if (otp.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await verifyEmailCode(email, otp);
            setSuccess(true);
            setTimeout(() => {
                navigate(user?.isAdmin ? '/admin' : '/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed. Please check the code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto w-full">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                            <Heart className="text-white w-6 h-6 fill-current" />
                        </div>
                        <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-brand-600 to-primary-600 bg-clip-text text-transparent">
                            Shubh Vivah
                        </span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-brand-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
                        <p className="text-gray-500 mt-2">
                            We've sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-600 text-sm">
                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Email Verified!</h3>
                            <p className="text-gray-500 mt-2">Redirecting to your dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="flex justify-between gap-2">
                                {code.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-${idx}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                                    />
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-4 rounded-xl text-lg font-bold flex items-center justify-center shadow-lg shadow-brand-200 disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Verify Email <ArrowRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <p className="text-sm text-gray-500">
                                    Didn't receive the code?{' '}
                                    <button
                                        type="button"
                                        onClick={() => {/* Implement resend logic later if needed */ }}
                                        className="text-brand-600 font-bold hover:underline"
                                    >
                                        Resend Code
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
