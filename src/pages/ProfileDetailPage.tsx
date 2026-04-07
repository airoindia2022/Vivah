import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    MapPin, Briefcase, GraduationCap, Ruler, Calendar, Heart,
    Phone, Share2, ShieldCheck, CheckCircle2,
    ChevronLeft, ChevronRight, Info, Users, Star, Lock, Mail, MessageCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { useUpgrade } from '../hooks/useUpgrade';

export const ProfileDetailPage = () => {
    const { id } = useParams();
    const [activePhoto, setActivePhoto] = useState(0);
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const { handleUpgrade } = useUpgrade();

    const isPremium = currentUser?.isAdmin || (currentUser?.subscriptionTier && ['Silver', 'Gold', 'Diamond'].includes(currentUser.subscriptionTier));

    const { data: profile, isLoading, error } = useQuery<UserProfile>({
        queryKey: ['profile', id],
        queryFn: () => profileService.getProfileById(id!),
        enabled: !!id,
    });

    const shortlistMutation = useMutation({
        mutationFn: () => profileService.toggleShortlist(id!),
        onSuccess: (data: any) => {
            useAuthStore.getState().toggleShortlistStore(id!);
            alert(data.message || 'Shortlist updated!');
            queryClient.invalidateQueries({ queryKey: ['profile', id] });
            queryClient.invalidateQueries({ queryKey: ['shortlisted'] });
        },
    });

    const interestMutation = useMutation({
        mutationFn: () => profileService.sendInterest(id!),
        onSuccess: (data: any) => {
            alert(data.message || 'Interest sent successfully!');
            useAuthStore.getState().toggleInterestStore(id!);
            queryClient.invalidateQueries({ queryKey: ['profile', id] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to send interest');
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-6">
                <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                    <Info className="w-10 h-10 text-brand-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">Profile not found</p>
                <p className="text-gray-500">The profile you are looking for does not exist or has been removed.</p>
                <Link to="/search" className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition">
                    Back to Search
                </Link>
            </div>
        );
    }

    const nextPhoto = () => setActivePhoto((prev: number) => (prev + 1) % (profile.photos?.length || 1));
    const prevPhoto = () => setActivePhoto((prev: number) => (prev - 1 + (profile.photos?.length || 1)) % (profile.photos?.length || 1));

    const isShortlisted = currentUser?.shortlisted?.includes(profile.id || '');
    const isInterestSent = currentUser?.interestsSent?.includes(profile.id || '');

    return (
        <div className="bg-[#F8F9FA] min-h-screen pb-20 font-sans selection:bg-brand-200 selection:text-brand-900">
            {/* Header / Nav */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <Link to="/search" className="inline-flex items-center text-gray-600 hover:text-brand-600 transition-colors font-medium rounded-full px-4 py-2 hover:bg-brand-50">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to Matches
                    </Link>
                    <div className="flex gap-4">
                        <button className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                            <ShieldCheck className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Left Column - Photos & Key Actions */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Interactive Photo Gallery */}
                        <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border-[6px] border-white group">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activePhoto}
                                    src={profile.photos?.[activePhoto] || 'https://via.placeholder.com/400x600?text=No+Photo'}
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full h-full object-cover"
                                    alt={profile.fullName}
                                />
                            </AnimatePresence>

                            {/* Verification Badge Overlay */}
                            {profile.isVerified && (
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center shadow-lg border border-white/50">
                                    <CheckCircle2 className="w-4 h-4 text-brand-500 mr-2" />
                                    <span className="text-xs font-bold text-gray-800 tracking-wide">Verified</span>
                                </div>
                            )}

                            {/* Gallery Navigation Controls */}
                            {(profile.photos?.length || 0) > 1 && (
                                <>
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                        <button onClick={prevPhoto} className="p-3 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all shadow-xl pointer-events-auto transform hover:scale-110">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button onClick={nextPhoto} className="p-3 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-white hover:text-black transition-all shadow-xl pointer-events-auto transform hover:scale-110">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-6 inset-x-0 flex justify-center space-x-2.5">
                                        {profile.photos.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActivePhoto(i)}
                                                className={`h-2 rounded-full transition-all duration-300 ${i === activePhoto ? 'w-8 bg-white shadow-lg' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                            {/* Decorative Background Blob */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

                            <div className="space-y-4 relative z-10">
                                <button
                                    onClick={() => shortlistMutation.mutate()}
                                    disabled={shortlistMutation.isPending}
                                    className={`w-full py-4 rounded-xl flex items-center justify-center font-bold text-[15px] transition-all duration-300 ${isShortlisted
                                        ? 'bg-brand-50 text-brand-600 border border-brand-200'
                                        : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5'
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 mr-2 ${isShortlisted ? 'fill-current text-brand-600' : 'text-white'}`} />
                                    {isShortlisted ? 'Shortlisted' : 'Shortlist Profile'}
                                </button>

                                <button
                                    onClick={() => interestMutation.mutate()}
                                    disabled={interestMutation.isPending || isInterestSent || id === currentUser?._id}
                                    className={`w-full py-4 rounded-xl flex items-center justify-center font-bold text-[15px] transition-all duration-300 ${isInterestSent
                                        ? 'bg-blue-50 text-blue-600 border border-blue-200 cursor-default'
                                        : 'bg-white text-brand-600 border-2 border-brand-500 hover:bg-brand-50 shadow-md transform hover:-translate-y-0.5 active:scale-95'
                                        } ${(interestMutation.isPending || isInterestSent) ? 'opacity-80' : ''}`}
                                >
                                    <Star className={`w-5 h-5 mr-2 ${isInterestSent ? 'fill-current text-blue-600' : 'text-brand-500'}`} />
                                    {isInterestSent ? 'Interest Sent' : 'Send Interest'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Comprehensive Info */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Primary Info Hero Section */}
                        <section className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            {!isPremium && (
                                <div className="mb-8 bg-gradient-to-br from-brand-50/80 to-pink-50/80 border border-brand-100/50 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <Lock className="w-24 h-24" />
                                    </div>
                                    <div className="flex items-start gap-4 z-10">
                                        <div className="p-3 bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-white mt-1 sm:mt-0 shrink-0">
                                            <Lock className="w-6 h-6 text-brand-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-brand-900 font-extrabold text-lg">Premium Content Locked</h3>
                                            <p className="text-brand-700/90 text-sm md:text-base mt-1.5 leading-relaxed max-w-xl font-medium">
                                                Upgrade your membership to seamlessly view contact information, family background, caste, and personal hobbies.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleUpgrade}
                                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5 transition-all whitespace-nowrap z-10 shrink-0"
                                    >
                                        Upgrade Now
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end mb-8 gap-4">
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                                        {profile.fullName}
                                    </h1>
                                    <div className="flex items-center text-gray-500 gap-3 text-sm font-medium">
                                        <span className="bg-gray-100 px-3 py-1 rounded-md">VIV-{profile.id?.substring(0, 6)}</span>
                                        <span className="flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                                            Active recently
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Calendar className="w-6 h-6 text-brand-500 mb-2" />
                                    <span className="text-sm text-gray-500 font-medium">Age</span>
                                    <span className="font-bold text-gray-900">{profile.age} yrs</span>
                                </div>
                                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Ruler className="w-6 h-6 text-brand-500 mb-2" />
                                    <span className="text-sm text-gray-500 font-medium">Height</span>
                                    <span className="font-bold text-gray-900">{profile.height}</span>
                                </div>
                                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <MapPin className="w-6 h-6 text-brand-500 mb-2" />
                                    <span className="text-sm text-gray-500 font-medium">Location</span>
                                    <span className="font-bold text-gray-900">{profile.location?.city || 'N/A'}</span>
                                </div>
                                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Briefcase className="w-6 h-6 text-brand-500 mb-2" />
                                    <span className="text-sm text-gray-500 font-medium">Profession</span>
                                    <span className="font-bold text-gray-900 line-clamp-1">{profile.profession || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-4 relative">
                                <div className="absolute top-0 left-0 text-6xl text-brand-100 font-serif leading-none -mt-4 opacity-50">"</div>
                                <p className="text-gray-700 leading-relaxed text-lg z-10 relative pt-2 px-6">
                                    {profile.bio || "No bio provided."}
                                </p>
                            </div>
                        </section>

                        {/* Education & Career Background */}
                        <section className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <h3 className="text-2xl font-bold mb-8 flex items-center text-gray-900">
                                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mr-4">
                                    <GraduationCap className="w-5 h-5 text-brand-600" />
                                </div>
                                Education & Career
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-200">
                                    <div className="relative pl-10">
                                        <div className="absolute left-2 top-1.5 w-2 h-2 rounded-full bg-brand-500 ring-4 ring-white" />
                                        <p className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-1">Education</p>
                                        <p className="font-semibold text-gray-900 text-lg">{profile.education || 'Not specified'}</p>
                                    </div>
                                </div>
                                <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-200">
                                    <div className="relative pl-10">
                                        <div className="absolute left-2 top-1.5 w-2 h-2 rounded-full bg-brand-500 ring-4 ring-white" />
                                        <p className="text-sm font-bold text-brand-600 uppercase tracking-wider mb-1">Profession</p>
                                        <p className="font-semibold text-gray-900 text-lg">{profile.profession || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Premium Section Container (Everything below this requires premium) */}
                        <div className="relative mt-8">
                            {!isPremium && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[12px] rounded-[2.5rem] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">

                                </div>
                            )}

                            {/* The content that gets blurred if not premium */}
                            <div className={`space-y-8 ${!isPremium ? 'opacity-30 pointer-events-none select-none filter blur-[8px] grayscale-[30%] transition-all duration-500' : ''}`}>

                                {/* Contact Hub */}
                                <section className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                    <h3 className="text-2xl font-bold mb-8 flex items-center text-gray-900">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mr-4">
                                            <Phone className="w-5 h-5 text-green-600" />
                                        </div>
                                        Contact Options
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <a href={`tel:${profile.phoneNumber}`} className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-green-50 hover:text-green-600 transition-colors group">
                                            <Phone className="w-8 h-8 text-gray-400 group-hover:text-green-500 mb-3" />
                                            <span className="font-bold text-gray-900 group-hover:text-green-700">Call Direct</span>
                                            <span className="text-xs text-gray-500 mt-1">{profile.phoneNumber || 'Not provided'}</span>
                                        </a>
                                        <a href={`https://wa.me/${profile.whatsappNumber?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors group">
                                            <MessageCircle className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-3" />
                                            <span className="font-bold text-gray-900 group-hover:text-blue-700">WhatsApp</span>
                                            <span className="text-xs text-gray-500 mt-1">{profile.whatsappNumber || 'Not provided'}</span>
                                        </a>
                                        <a href={`mailto:${profile.contactEmail}`} className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-brand-50 hover:text-brand-600 transition-colors group">
                                            <Mail className="w-8 h-8 text-gray-400 group-hover:text-brand-500 mb-3" />
                                            <span className="font-bold text-gray-900 group-hover:text-brand-700">Email</span>
                                            <span className="text-xs text-gray-500 mt-1">{profile.contactEmail || profile.email || 'Not provided'}</span>
                                        </a>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Religion & Background */}
                                    <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mr-4">
                                                <Info className="w-5 h-5 text-orange-600" />
                                            </div>
                                            Background & Appearance
                                        </h3>
                                        <div className="space-y-5">
                                            <div className="bg-gray-50 px-5 py-4 rounded-xl flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Religion</span>
                                                <span className="font-bold text-gray-900">{profile.religion || 'Not specified'}</span>
                                            </div>
                                            <div className="bg-gray-50 px-5 py-4 rounded-xl flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Caste</span>
                                                <span className="font-bold text-gray-900">{profile.caste || 'Not specified'}</span>
                                            </div>
                                            <div className="bg-gray-50 px-5 py-4 rounded-xl flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Skin Color</span>
                                                <span className="font-bold text-gray-900">{profile.skinColor || 'Not specified'}</span>
                                            </div>
                                            <div className="bg-gray-50 px-5 py-4 rounded-xl flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Weight</span>
                                                <span className="font-bold text-gray-900">{profile.weight || 'Not specified'}</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Family Details */}
                                    <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mr-4">
                                                <Users className="w-5 h-5 text-purple-600" />
                                            </div>
                                            Family
                                        </h3>
                                        <div className="space-y-5">
                                            <div className="bg-gray-50 px-5 py-3 rounded-xl flex flex-col">
                                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Father's Status</span>
                                                <span className="font-bold text-gray-900">{profile.familyDetails?.fatherStatus || 'Not specified'}</span>
                                            </div>
                                            <div className="bg-gray-50 px-5 py-3 rounded-xl flex flex-col">
                                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Mother's Status</span>
                                                <span className="font-bold text-gray-900">{profile.familyDetails?.motherStatus || 'Not specified'}</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="bg-gray-50 px-5 py-3 rounded-xl flex-1 flex flex-col">
                                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Siblings</span>
                                                    <span className="font-bold text-gray-900">{profile.familyDetails?.siblings || 'N/A'}</span>
                                                </div>
                                                <div className="bg-gray-50 px-5 py-3 rounded-xl flex-1 flex flex-col">
                                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Values</span>
                                                    <span className="font-bold text-gray-900">{profile.familyDetails?.familyValues || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Interests & Hobbies */}
                                <section className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                    <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                                        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center mr-4">
                                            <Star className="w-5 h-5 text-pink-600" />
                                        </div>
                                        Interests & Hobbies
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {profile.interests?.length > 0 ? profile.interests.map(interest => (
                                            <span key={interest} className="px-5 py-2.5 bg-gray-50 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors text-gray-700 rounded-xl font-medium border border-gray-200 cursor-default">
                                                {interest}
                                            </span>
                                        )) : (
                                            <div className="w-full flex items-center justify-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                                <span className="text-gray-500">No interests specified yet</span>
                                            </div>
                                        )}
                                    </div>
                                </section>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
