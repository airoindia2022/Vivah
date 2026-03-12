import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Heart, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/api';
import { motion } from 'framer-motion';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
    const [error, setError] = React.useState<string | null>(null);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setError(null);
        try {
            await authService.forgotPassword(data.email);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200">
                            <Heart className="text-white w-7 h-7 fill-current" />
                        </div>
                        <span className="text-3xl font-extrabold font-display bg-gradient-to-r from-brand-600 to-primary-600 bg-clip-text text-transparent">
                            Vivah
                        </span>
                    </Link>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold font-display text-gray-900">
                    Forgot Password?
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    No worries! Enter your email and we'll send you a reset link.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4"
            >
                <div className="bg-white py-10 px-6 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 sm:px-10">
                    {isSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">Check your email</h3>
                                <p className="text-gray-600">
                                    We've sent a password reset link to your email address. It will expire in 10 minutes.
                                </p>
                            </div>
                            <Link
                                to="/login"
                                className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-bold rounded-2xl text-white bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-200 transition-all"
                            >
                                Return to login
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center text-sm">
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        {...register('email')}
                                        className={`w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none transition-all focus:ring-2 focus:bg-white ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-brand-500'}`}
                                        placeholder="name@example.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary py-4 rounded-2xl shadow-xl shadow-brand-200 flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Send Reset Link <ArrowRight className="ml-2 w-5 h-5" /></>
                                )}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-sm font-bold text-brand-600 hover:text-brand-500">
                                    Back to login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
