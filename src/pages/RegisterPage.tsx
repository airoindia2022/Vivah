import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, User, MapPin, Briefcase, Camera, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { profileService, authService } from '../services/api';
import { RELIGIONS } from '../data/constants';

export const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { register: registerUser } = useAuthStore();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        gender: 'Male',
        age: 18,
        religion: '',
        city: '',
        profession: '',
        education: '',
        photos: [] as string[]
    });

    const [showOTP, setShowOTP] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    const handleSendOTP = async () => {
        if (!formData.fullName || !formData.email || !formData.password) {
            setError('Please fill in all basic details');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await authService.sendOTP(formData.email);
            if (data.otpDisabled) {
                setIsEmailVerified(true);
                setStep(2);
            } else {
                setShowOTP(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const code = otpCode.join('');
        if (code.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await authService.verifyOTP(formData.email, code);
            setIsEmailVerified(true);
            setShowOTP(false);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value) : value }));
    };

    const handleGenderChange = (gender: string) => {
        setFormData(prev => ({ ...prev, gender }));
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setLoading(true);
        const form = new FormData();
        form.append('image', e.target.files[0]);

        try {
            const data = await profileService.uploadImage(form);
            setFormData(prev => ({ ...prev, photos: [...prev.photos, data.url] }));
        } catch (err) {
            setError('Photo upload failed');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && !isEmailVerified) {
            handleSendOTP();
            return;
        }
        if (step === 2 && (!formData.city || !formData.profession || !formData.education)) {
            setError('Please provide your career and location info');
            return;
        }
        setError(null);
        setStep(s => s + 1);
    };

    const prevStep = () => {
        if (showOTP) {
            setShowOTP(false);
        } else {
            setStep(s => s - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await registerUser(formData);
            navigate(res?.isAdmin ? '/admin' : '/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, name: 'Personal', icon: <User /> },
        { id: 2, name: 'Career', icon: <Briefcase /> },
        { id: 3, name: 'Photos', icon: <Camera /> }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 italic-not-really">
            <div className="max-w-2xl mx-auto w-full">
                <div className="flex justify-center mb-10">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                            <Heart className="text-white w-6 h-6 fill-current" />
                        </div>
                        <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-brand-600 to-primary-600 bg-clip-text text-transparent italic NOT-italic">
                            Shubh Vivah
                        </span>
                    </Link>
                </div>

                {/* Stepper */}
                <div className="flex justify-between items-center mb-12 px-8">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className="flex flex-col items-center relative z-10">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-brand-600 text-white shadow-xl shadow-brand-200' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                    {step > s.id ? <Check className="w-6 h-6" /> : React.cloneElement(s.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
                                </div>
                                <span className={`mt-3 text-xs font-bold uppercase tracking-wider ${step >= s.id ? 'text-brand-600' : 'text-gray-400'}`}>{s.name}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className="flex-grow h-0.5 bg-gray-200 mx-4 mt-[-20px]">
                                    <motion.div
                                        className="h-full bg-brand-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: step > s.id ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 rounded-[2.5rem] flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 && !showOTP && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold font-display">Let's get started</h2>
                                    <p className="text-gray-500">Provide your basic information to begin.</p>
                                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                                        <input
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Age</label>
                                        <input
                                            name="age"
                                            type="number"
                                            value={formData.age}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                                            placeholder="Years"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Religion</label>
                                        <select
                                            name="religion"
                                            value={formData.religion}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all appearance-none"
                                        >
                                            <option value="">Select Religion</option>
                                            {RELIGIONS.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {['Male', 'Female'].map(g => (
                                                <button
                                                    key={g}
                                                    onClick={() => handleGenderChange(g)}
                                                    className={`py-4 border rounded-2xl font-bold transition-all ${formData.gender === g ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-200' : 'border-gray-200 hover:bg-brand-50 hover:border-brand-500'}`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <button onClick={nextStep} className="w-full btn-primary py-5 rounded-2xl text-lg flex items-center justify-center shadow-xl shadow-brand-200 font-bold">
                                        Verify Email <ChevronRight className="ml-2 w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 1 && showOTP && (
                            <motion.div
                                key="otp-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold font-display">Verify your email</h2>
                                    <p className="text-gray-500">We've sent a code to <span className="font-bold text-gray-900">{formData.email}</span></p>
                                    {error && <p className="text-red-500 text-sm mt-4 font-bold">{error}</p>}
                                </div>

                                <div className="flex justify-between gap-2 max-w-xs mx-auto">
                                    {otpCode.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            id={`otp-reg-${idx}`}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (!/^\d*$/.test(val)) return;
                                                const newOtp = [...otpCode];
                                                newOtp[idx] = val.slice(-1);
                                                setOtpCode(newOtp);
                                                if (val && idx < 5) document.getElementById(`otp-reg-${idx + 1}`)?.focus();
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) document.getElementById(`otp-reg-${idx - 1}`)?.focus();
                                            }}
                                            className="w-12 h-14 text-center text-2xl font-black bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                                        />
                                    ))}
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-gray-500 font-medium">
                                        Didn't receive the code?{' '}
                                        <button
                                            type="button"
                                            onClick={handleSendOTP}
                                            className="text-brand-600 font-bold hover:underline"
                                        >
                                            Resend Code
                                        </button>
                                    </p>
                                </div>

                                <div className="pt-8 grid grid-cols-2 gap-4">
                                    <button onClick={prevStep} className="py-5 border border-gray-200 rounded-2xl font-bold text-gray-700 flex items-center justify-center hover:bg-gray-50">
                                        <ChevronLeft className="mr-2 w-5 h-5" /> Back
                                    </button>
                                    <button onClick={handleVerifyOTP} className="btn-primary py-5 rounded-2xl text-lg font-bold flex items-center justify-center shadow-xl shadow-brand-200">
                                        Verify & Continue <ChevronRight className="ml-2 w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold font-display">Tell us about your career</h2>
                                    <p className="text-gray-500">Matches find this information very helpful.</p>
                                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Highest Education</label>
                                        <input
                                            name="education"
                                            value={formData.education}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                                            placeholder="e.g. B.Tech Computer Science"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Profession</label>
                                        <input
                                            name="profession"
                                            value={formData.profession}
                                            onChange={handleChange}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                                            placeholder="e.g. Software Engineer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Current City</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                                                placeholder="e.g. Mumbai, Maharashtra"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 grid grid-cols-2 gap-4">
                                    <button onClick={prevStep} className="py-5 border border-gray-200 rounded-2xl font-bold text-gray-700 flex items-center justify-center hover:bg-gray-50">
                                        <ChevronLeft className="mr-2 w-5 h-5" /> Back
                                    </button>
                                    <button onClick={nextStep} className="btn-primary py-5 rounded-2xl text-lg flex items-center justify-center shadow-xl shadow-brand-200">
                                        Next Step <ChevronRight className="ml-2 w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold font-display">Add profile photos</h2>
                                    <p className="text-gray-500">Profiles with photos get 10x more interests.</p>
                                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {formData.photos.map((url, i) => (
                                        <div key={i} className="aspect-[3/4] rounded-3xl overflow-hidden border-2 border-brand-100 shadow-md">
                                            <img src={url} className="w-full h-full object-cover" alt="Profile" />
                                        </div>
                                    ))}

                                    {formData.photos.length < 3 && (
                                        <label className="aspect-[3/4] border-2 border-dashed border-brand-200 rounded-3xl flex flex-col items-center justify-center bg-brand-50/50 cursor-pointer hover:bg-brand-50 transition-all border-spacing-4">
                                            <Camera className="w-8 h-8 text-brand-500 mb-2" />
                                            <span className="text-xs font-bold text-brand-600">Upload Photo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                        </label>
                                    )}
                                </div>

                                <div className="pt-8 grid grid-cols-2 gap-4">
                                    <button onClick={prevStep} className="py-5 border border-gray-200 rounded-2xl font-bold text-gray-700 flex items-center justify-center shadow-sm">
                                        <ChevronLeft className="mr-2 w-5 h-5" /> Back
                                    </button>
                                    <button onClick={handleSubmit} className="btn-primary py-5 rounded-2xl text-lg flex items-center justify-center shadow-xl shadow-brand-200">
                                        Complete Registration <Check className="ml-2 w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="mt-8 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-extrabold text-brand-600 hover:text-brand-500 text-lg">
                        Log in here
                    </Link>
                </p>
            </div>
        </div>
    );
};
