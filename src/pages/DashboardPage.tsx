import React, { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
    Heart, Eye, Settings,
    ChevronRight, Star, Edit2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { ProfileCard } from '../components/ProfileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/api';

export const DashboardPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState<'recommended' | 'shortlisted'>('recommended');

    React.useEffect(() => {
        if (user?.isAdmin) {
            navigate('/admin', { replace: true });
        }
    }, [user, navigate]);

    const { data: recommendations, isLoading: loadingRecs, isError: errorRecs } = useQuery({
        queryKey: ['recommendations'],
        queryFn: () => profileService.getProfiles({ 
            gender: user?.gender === 'Male' ? 'Female' : 'Male',
            limit: 4 
        }),
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const { data: shortlisted, isLoading: loadingShortlisted } = useQuery({
        queryKey: ['shortlisted'],
        queryFn: () => profileService.getShortlisted(),
        enabled: !!user,
    });

    const { data: visitors, isLoading: loadingVisitors } = useQuery({
        queryKey: ['visitors'],
        queryFn: profileService.getVisitors,
        enabled: !!user,
    });


    // Dynamic Completeness Calculation
    const completeness = useMemo(() => {
        if (!user) return 0;
        let score = 0;
        if (user.fullName) score += 15;
        if (user.age) score += 5;
        if (user.gender) score += 5;
        if (user.location?.city) score += 10;
        if (user.bio) score += 15;
        if (user.photos && user.photos.length > 0) score += 20;
        if (user.profession) score += 10;
        if (user.phoneNumber) score += 10;
        if (user.contactEmail) score += 10;
        return score;
        return score;
    }, [user]);

    const stats = [
        { 
            label: 'Matches', 
            count: recommendations?.length || 0, 
            icon: <Star className="text-brand-500" />, 
            bg: 'bg-brand-50', 
            link: '/search' 
        },
        { 
            label: 'Shortlisted', 
            count: shortlisted?.length || 0, 
            icon: <Heart className="text-pink-500" />, 
            bg: 'bg-pink-50', 
            link: '/search' 
        },
        { 
            label: 'Profile Views', 
            count: visitors?.length || 0, 
            icon: <Eye className="text-blue-500" />, 
            bg: 'bg-blue-50', 
            link: '/dashboard' 
        },
    ];

    if (!user) return null;

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
                {/* Modernized Header */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center space-x-8">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative"
                        >
                            <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl ring-8 ring-brand-500/5">
                                <img 
                                    src={user.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=f97316&color=fff&size=128`} 
                                    className="w-full h-full object-cover" 
                                    alt={user.fullName} 
                                />
                            </div>
                            <Link 
                                to="/profile/edit" 
                                className="absolute -bottom-2 -right-2 p-2.5 bg-brand-600 text-white rounded-2xl shadow-xl hover:bg-brand-700 transition-all hover:scale-110 active:scale-95"
                                title="Edit Profile"
                            >
                                <Edit2 className="w-4 h-4" />
                            </Link>
                        </motion.div>
                        
                        <div className="space-y-1">
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl lg:text-5xl font-black font-display text-slate-900"
                            >
                                Hi, {user.fullName.split(' ')[0]}!
                            </motion.h1>
                            <p className="text-slate-500 font-bold flex items-center gap-2">
                                {completeness === 100 ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span>Profile fully verified & optimized</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                        <span>Your profile is {completeness}% complete</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/profile/edit" className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-slate-700 font-black text-sm shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            <Settings className="w-5 h-5 text-slate-400" />
                            <span>Dashboard Settings</span>
                        </Link>
                    </div>
                </header>

                {/* Performance Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link
                                to={s.link}
                                className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center text-center group hover:shadow-2xl hover:shadow-brand-500/10 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className={`w-16 h-16 ${s.bg} rounded-3xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 group-hover:rotate-6`}>
                                    {React.cloneElement(s.icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8' })}
                                </div>
                                <p className="text-4xl font-black text-slate-900 mb-0.5 tracking-tighter">{s.count}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content (Recommendations & Shortlist) */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                <div className="flex bg-slate-200/50 p-1.5 rounded-[1.25rem] w-full sm:w-fit">
                                    <button
                                        onClick={() => setActiveTab('recommended')}
                                        className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'recommended' ? 'bg-white text-brand-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Member Match
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('shortlisted')}
                                        className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${activeTab === 'shortlisted' ? 'bg-white text-brand-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Shortlisted
                                    </button>
                                </div>
                                <Link to="/search" className="text-brand-600 font-black text-xs uppercase tracking-widest hover:text-brand-700 flex items-center gap-1 group">
                                    Browse Directory <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-8"
                                >
                                    {activeTab === 'recommended' ? (
                                        loadingRecs ? (
                                            Array(2).fill(0).map((_, i) => (
                                                <div key={i} className="h-80 bg-white rounded-[2.5rem] animate-pulse shadow-sm" />
                                            ))
                                        ) : errorRecs ? (
                                            <div className="col-span-full py-16 text-center bg-rose-50 rounded-[2.5rem] border border-rose-100 p-8">
                                                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                                                <h4 className="text-lg font-bold text-rose-900">Connection Issue</h4>
                                                <p className="text-rose-600 font-medium text-sm mt-1 mb-6">We're having trouble loading recommendations at the moment.</p>
                                                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all">Try Again</button>
                                            </div>
                                        ) : recommendations?.length === 0 ? (
                                            <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-slate-100 border-dashed text-center p-12">
                                                <p className="text-slate-400 font-black text-lg">No matches found yet.</p>
                                                <p className="text-slate-400 font-medium text-sm mt-2 italic">Try updating your preferences or bio for better visibility.</p>
                                                <Link to="/profile/edit" className="mt-8 inline-block px-10 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 shadow-xl shadow-brand-500/20 transform hover:-translate-y-1 transition-all">Update Preferences</Link>
                                            </div>
                                        ) : (
                                            recommendations?.slice(0, 4).map((profile: any) => (
                                                <ProfileCard key={profile.id} profile={profile} />
                                            ))
                                        )
                                    ) : (
                                        loadingShortlisted ? (
                                            Array(2).fill(0).map((_, i) => (
                                                <div key={i} className="h-80 bg-white rounded-[2.5rem] animate-pulse shadow-sm" />
                                            ))
                                        ) : shortlisted?.length === 0 ? (
                                            <div className="col-span-full py-24 bg-white rounded-[3rem] border-2 border-slate-100 border-dashed text-center p-12">
                                                <Heart className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                                                <p className="text-slate-400 font-black text-lg">Your shortlist is empty.</p>
                                                <p className="text-slate-400 font-medium text-sm mt-1">Found someone you like? Hit the heart icon to save them here.</p>
                                                <Link to="/search" className="mt-8 inline-block px-10 py-4 border-2 border-brand-600 text-brand-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-50 transition-all">Start Exploring</Link>
                                            </div>
                                        ) : (
                                            shortlisted?.map((profile: any) => (
                                                <ProfileCard key={profile.id} profile={profile} />
                                            ))
                                        )
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </section>

                        {/* Visitors Section */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black font-display text-slate-900 tracking-tight">Recent Profile Visits</h2>
                                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest bg-brand-50 px-4 py-1.5 rounded-full ring-1 ring-brand-500/20">Live Sync</span>
                            </div>
                            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                                {loadingVisitors ? (
                                    <div className="p-20 text-center">
                                        <div className="w-10 h-10 border-[5px] border-slate-100 border-t-brand-600 rounded-full animate-spin mx-auto" />
                                    </div>
                                ) : visitors?.length === 0 ? (
                                    <div className="p-20 text-center text-slate-400 font-bold italic">
                                        No recent visits tracked yet.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {visitors?.slice(0, 5).map((visitor: any) => (
                                            <Link
                                                to={`/profile/${visitor.user._id}`}
                                                key={visitor._id}
                                                className="flex items-center justify-between p-8 hover:bg-slate-50 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center space-x-6">
                                                    <div className="relative">
                                                        <img 
                                                            src={visitor.user.photos?.[0] || 'https://via.placeholder.com/150'} 
                                                            className="w-20 h-20 rounded-[2rem] object-cover ring-4 ring-white shadow-lg" 
                                                            alt="" 
                                                        />
                                                        {visitor.user.isVerified && <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white text-[8px]"><CheckCircle2 size={12} /></div>}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-xl group-hover:text-brand-600 transition-colors tracking-tight">{visitor.user.fullName}</p>
                                                        <p className="text-sm text-slate-500 font-medium">
                                                            {visitor.user.age} yrs • {visitor.user.location?.city || 'India'} • {visitor.user.profession || 'Professional'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(visitor.visitedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-brand-500" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Optimization Cards */}
                    <div className="space-y-8">
                        {/* Profile optimization card */}
                        <motion.section 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-brand-600 p-10 rounded-[3rem] shadow-2xl shadow-brand-500/30 text-white relative overflow-hidden group"
                        >
                            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                            
                            <h3 className="text-2xl font-black font-display mb-2 drop-shadow-md">Profile Optimization</h3>
                            <p className="text-brand-100 text-sm font-medium mb-8 leading-relaxed italic opacity-90">Maximize your reach by completing 100% of your profile details.</p>
                            
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-black uppercase tracking-widest">{completeness}% Complete</span>
                                        <span className="text-xs font-medium text-brand-200">Level {Math.floor(completeness/25)+1}</span>
                                    </div>
                                    <div className="relative h-3 bg-brand-900/30 rounded-full overflow-hidden backdrop-blur-sm">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${completeness}%` }}
                                            className="absolute inset-y-0 left-0 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                                        />
                                    </div>
                                </div>
                                
                                <ul className="space-y-3 pt-4 border-t border-white/10">
                                    {[
                                        { text: 'Basic Identity', done: !!user.fullName && !!user.age },
                                        { text: 'Professional Bio', done: !!user.bio },
                                        { text: 'Verify Photos', done: user.photos && user.photos.length > 0 },
                                        { text: 'Partner Preferences', done: true }, // Placeholder logic
                                        { text: 'Family Information', done: !!user.profession }, // Mock check
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center justify-between text-sm">
                                            <span className={`font-bold tracking-tight ${item.done ? 'text-white' : 'text-brand-200 opacity-60'}`}>{item.text}</span>
                                            {item.done ? (
                                                <CheckCircle2 className="w-5 h-5 text-brand-300" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-brand-200/30" />
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                {completeness < 100 && (
                                    <Link 
                                        to="/profile/edit" 
                                        className="mt-4 w-full py-4 bg-white text-brand-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-50 shadow-xl transform active:scale-95 transition-all block text-center"
                                    >
                                        Optimize Now
                                    </Link>
                                )}
                            </div>
                        </motion.section>

                        {/* Safety Tips Card */}
                        <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white">
                            <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-3">
                                <ShieldCheck className="text-brand-500" />
                                <span>Safe Search</span>
                            </h3>
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Gold Rule</p>
                                    <p className="text-xs text-slate-300 leading-relaxed italic">Never share bank details or OTPs with anyone claiming to be from our staff.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">Verified Only</p>
                                    <p className="text-xs text-slate-300 leading-relaxed italic">Look for the blue checkmark to ensure identity authenticity.</p>
                                </div>
                                <button className="w-full py-3 text-xs font-bold text-slate-400 hover:text-white transition-colors underline decoration-brand-500 decoration-2 underline-offset-4">
                                    Read Safety Guidelines
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShieldCheck = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
);
