import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const [error, setError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setError(null);
        try {
            const res = await login(data);
            if (res.requiresVerification) {
                navigate('/verify-email', { state: { email: data.email } });
                return;
            }
            navigate(res.isAdmin ? '/admin' : '/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
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
                    Sign In to Your Account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Discover your perfect match today.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4"
            >
                <div className="bg-white py-10 px-6 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 sm:px-10">
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

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    {...register('password')}
                                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none transition-all focus:ring-2 focus:bg-white ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-brand-500'}`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input type="checkbox" className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
                                <label className="ml-2 block text-sm text-gray-700 font-medium">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <Link to="/forgot-password" title="Recover your password" id="forgot-password-link" className="font-bold text-brand-600 hover:text-brand-500">Forgot password?</Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary py-4 rounded-2xl shadow-xl shadow-brand-200 flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight className="ml-2 w-5 h-5" /></>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-sm text-gray-600">
                    New to Vivah?{' '}
                    <Link to="/register" className="font-extrabold text-brand-600 hover:text-brand-500">
                        Create an account for free
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};
