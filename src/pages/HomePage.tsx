import { Users, ShieldCheck, Phone, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfileCard } from '../components/ProfileCard';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/api';
import type { UserProfile } from '../types';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const HomePage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [quickSearch, setQuickSearch] = useState({
        gender: 'Female',
        ageMin: 18,
        ageMax: 30,
    });

    const handleQuickSearch = () => {
        const params = new URLSearchParams({
            gender: quickSearch.gender,
            ageMin: String(quickSearch.ageMin),
            ageMax: String(quickSearch.ageMax),
        });
        navigate(`/search?${params.toString()}`);
    };

    const { data: profiles, isLoading } = useQuery<UserProfile[]>({
        queryKey: ['featured-profiles'],
        queryFn: () => profileService.getProfiles(),
    });

    const features = [
        {
            icon: <Users className="w-8 h-8 text-brand-600" />,
            title: "Handpicked Matches",
            desc: "Profiles verified by our experts to ensure genuine connections."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-brand-600" />,
            title: "100% Privacy",
            desc: "Your data is secure and you control who sees your profile."
        },
        {
            icon: <Phone className="w-8 h-8 text-brand-600" />,
            title: "Connect with Ease",
            desc: "Connect seamlessly with potential partners via calls or requests."
        }
    ];

    const testimonials = [
        {
            name: "Aman & Shonali",
            photo: "https://res.cloudinary.com/ddd0pijhx/image/upload/v1772124848/vivah_matrimony/ljfqvyctqhsgxxym4ykg.jpg?q=80&w=400&auto=format&fit=crop",
            text: "We found our perfect match within 3 months. The filters helped us find exactly what we were looking for."
        },
        {
            name: "Ravi & Priya",
            photo: "https://res.cloudinary.com/ddd0pijhx/image/upload/v1772124848/vivah_matrimony/ljfqvyctqhsgxxym4ykg.jpg?q=80&w=400&auto=format&fit=crop",
            text: "We found our perfect match within 3 months. The filters helped us find exactly what we were looking for."
        }
    ];

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center pt-10 px-4 mt-16 md:mt-0">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000&auto=format&fit=crop"
                        alt="Hero Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center space-x-2 bg-brand-50 text-brand-600 px-4 py-2 rounded-full font-semibold text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            <span>#1 Trusted Matrimony Service</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold font-display leading-tight text-gray-900">
                            Begin Your Journey to a Beautiful Forever
                        </h1>

                        <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                            Millions of success stories. Start yours today. Join over 5 million happy couples who found their forever on Shubh Vivah.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/register" className="btn-primary px-8 py-4 text-lg rounded-2xl shadow-xl shadow-brand-200 flex items-center justify-center">
                                Get Started <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <Link to="/search" className="px-8 py-4 text-lg rounded-2xl border-2 border-gray-200 font-medium hover:border-brand-500 hover:text-brand-600 transition-all flex items-center justify-center">
                                Browse Profiles
                            </Link>
                        </div>

                        <div className="flex items-center space-x-6 pt-4 text-sm text-gray-500">
                            <p><strong>10+</strong> New users joined today</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="hidden lg:block relative"
                    >
                        <div className="relative z-10 bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100 max-w-md ml-auto">
                            <h3 className="text-2xl font-bold mb-6">Quick Search</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-2">Looking for</label>
                                    <select
                                        value={quickSearch.gender}
                                        onChange={e => setQuickSearch(q => ({ ...q, gender: e.target.value }))}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                    >
                                        <option value="Female">Woman</option>
                                        <option value="Male">Man</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">Age From</label>
                                        <select
                                            value={quickSearch.ageMin}
                                            onChange={e => setQuickSearch(q => ({ ...q, ageMin: Number(e.target.value) }))}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                        >
                                            {[...Array(33)].map((_, i) => <option key={i + 18} value={i + 18}>{i + 18}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">To</label>
                                        <select
                                            value={quickSearch.ageMax}
                                            onChange={e => setQuickSearch(q => ({ ...q, ageMax: Number(e.target.value) }))}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                        >
                                            {[...Array(33)].map((_, i) => <option key={i + 18} value={i + 18}>{i + 18}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleQuickSearch}
                                    className="w-full btn-primary py-4 rounded-xl shadow-lg mt-4"
                                >
                                    Search Now
                                </button>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-brand-200/30 rounded-full blur-3xl -z-10" />
                        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary-200/30 rounded-full blur-3xl -z-10" />
                    </motion.div>
                </div>
            </section>

            {/* Featured Profiles */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-4xl font-extrabold font-display mb-4 text-gray-900">Featured Profiles</h2>
                            <p className="text-gray-600">Discover premium profiles that match your preferences.</p>
                        </div>
                        <Link to="/search" className="hidden md:flex items-center text-brand-600 font-bold hover:underline">
                            View All <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">Discovering premium profiles...</p>
                            </div>
                        ) : (
                            profiles?.slice(0, 6).map((profile) => (
                                <ProfileCard key={profile.id} profile={profile} />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-extrabold font-display mb-6">Why Choose Shubh Vivah?</h2>
                        <p className="text-lg text-gray-600">We understand that finding a life partner is a deeply personal journey. Our platform is designed to make it safe, easy, and meaningful.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {features.map((f, i) => (
                            <div key={i} className="text-center space-y-4 p-8 rounded-3xl hover:bg-brand-50 transition-colors">
                                <div className="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    {f.icon}
                                </div>
                                <h3 className="text-2xl font-bold font-display">{f.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-brand-950 text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold font-display mb-4">Success Stories</h2>
                        <p className="text-brand-200">Thousands of couples have found their happiness. Will you be next?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {testimonials.map((t, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-lg p-8 rounded-[2rem] border border-white/10 flex flex-col md:flex-row gap-6 items-center">
                                <img src={t.photo} className="w-32 h-32 rounded-2xl object-cover shrink-0" alt="" />
                                <div className="space-y-4">
                                    <p className="italic text-lg text-brand-100">"{t.text}"</p>
                                    <p className="font-bold text-xl">— {t.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Background blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 opacity-20 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-600 opacity-20 blur-[100px] rounded-full" />
            </section>

            {/* Final CTA - only shown to guests */}
            {!isAuthenticated && (
                <section className="py-24 bg-white overflow-hidden relative">
                    <div className="max-w-5xl mx-auto px-4 text-center">
                        <h2 className="text-5xl md:text-6xl font-extrabold font-display mb-8">Ready to find your <span className="text-brand-600">forever?</span></h2>
                        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">Registration is free and takes less than 2 minutes. Start your journey today.</p>
                        <Link to="/register" className="btn-primary px-12 py-5 text-xl rounded-2xl shadow-2xl shadow-brand-200 inline-block">
                            Register Free Now
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
};
