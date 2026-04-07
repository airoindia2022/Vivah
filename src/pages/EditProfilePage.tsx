import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import {
    User, MapPin, Briefcase, Camera, Save, ChevronLeft,
    GraduationCap, Heart, Users, Ruler, Phone, MessageCircle, Mail
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { profileService } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '../types';

import { RELIGIONS, MARITAL_STATUS_OPTIONS, FAMILY_VALUES_OPTIONS, SKIN_COLOR_OPTIONS, INTERESTS_OPTIONS } from '../data/constants';

export const EditProfilePage = () => {
    const { user, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [uploadingIdx, setUploadingIdx] = React.useState<number | null>(null);

    const { register, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: {
            fullName: '',
            age: 18,
            gender: 'Male',
            height: '',
            weight: '',
            skinColor: '',
            religion: '',
            caste: '',
            motherTongue: '',
            maritalStatus: 'Never Married',
            city: '',
            state: '',
            country: '',
            profession: '',
            education: '',
            income: '',
            bio: '',
            photos: [] as string[],
            interests: [] as string[],
            fatherStatus: '',
            motherStatus: '',
            siblings: '',
            familyValues: 'Moderate',
            phoneNumber: '',
            whatsappNumber: '',
            contactEmail: '',
        }
    });

    const photos = watch('photos');
    const selectedInterests = watch('interests');

    // Fetch full profile from API
    const { data: profileData, isLoading } = useQuery<UserProfile>({
        queryKey: ['myProfile', user?._id],
        queryFn: () => profileService.getProfileById(user!._id),
        enabled: !!user?._id,
    });

    // Populate form once data arrives (compatible with TanStack Query v4 & v5)
    useEffect(() => {
        if (!profileData) return;
        reset({
            fullName: profileData.fullName || '',
            age: profileData.age || 18,
            gender: profileData.gender || 'Male',
            height: profileData.height || '',
            weight: profileData.weight || '',
            skinColor: profileData.skinColor || '',
            religion: profileData.religion || '',
            caste: profileData.caste || '',
            motherTongue: profileData.motherTongue || '',
            maritalStatus: 'Never Married',
            city: profileData.location?.city || '',
            state: profileData.location?.state || '',
            country: profileData.location?.country || '',
            profession: profileData.profession || '',
            education: profileData.education || '',
            income: profileData.income || '',
            bio: profileData.bio || '',
            photos: profileData.photos || [],
            interests: profileData.interests || [],
            fatherStatus: profileData.familyDetails?.fatherStatus || '',
            motherStatus: profileData.familyDetails?.motherStatus || '',
            siblings: profileData.familyDetails?.siblings || '',
            familyValues: profileData.familyDetails?.familyValues || 'Moderate',
            phoneNumber: profileData.phoneNumber || '',
            whatsappNumber: profileData.whatsappNumber || '',
            contactEmail: profileData.contactEmail || '',
        });
    }, [profileData, reset]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const idx = photos.length;
        setUploadingIdx(idx);
        const form = new FormData();
        form.append('image', e.target.files[0]);
        try {
            const data = await profileService.uploadImage(form);
            setValue('photos', [...photos, data.url]);
        } catch {
            setError('Photo upload failed');
        } finally {
            setUploadingIdx(null);
        }
    };

    const toggleInterest = (interest: string) => {
        const current = selectedInterests || [];
        if (current.includes(interest)) {
            setValue('interests', current.filter(i => i !== interest));
        } else if (current.length < 10) {
            setValue('interests', [...current, interest]);
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        setError(null);
        try {
            const updatedUser = await profileService.updateProfile({
                fullName: data.fullName,
                age: Number(data.age),
                gender: data.gender,
                height: data.height,
                weight: data.weight,
                skinColor: data.skinColor,
                religion: data.religion,
                caste: data.caste,
                motherTongue: data.motherTongue,
                location: { city: data.city, state: data.state, country: data.country },
                profession: data.profession,
                education: data.education,
                income: data.income,
                bio: data.bio,
                photos: data.photos,
                interests: data.interests,
                familyDetails: {
                    fatherStatus: data.fatherStatus,
                    motherStatus: data.motherStatus,
                    siblings: data.siblings,
                    familyValues: data.familyValues,
                },
                phoneNumber: data.phoneNumber,
                whatsappNumber: data.whatsappNumber,
                contactEmail: data.contactEmail,
            });
            updateUser(updatedUser);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-3xl mx-auto px-4">
                <Link to="/dashboard" className="inline-flex items-center text-gray-500 hover:text-brand-600 mb-8 font-bold transition-colors">
                    <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
                </Link>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-10 border-b border-gray-50 bg-gradient-to-r from-brand-600 to-primary-600 text-white">
                        <h1 className="text-3xl font-bold font-display">Edit Your Profile</h1>
                        <p className="opacity-80 mt-1">Update your details to stand out.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-10">
                        {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">{error}</div>}

                        {/* ── Basic Info ── */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <User className="w-5 h-5 mr-2 text-brand-600" /> Basic Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                    <input {...register('fullName')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Age</label>
                                    <input type="number" min={18} max={70} {...register('age')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                                    <select {...register('gender')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none">
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        <Ruler className="w-4 h-4 text-brand-500" /> Height
                                    </label>
                                    <input placeholder={`e.g. 5'8"`} {...register('height')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Weight</label>
                                    <input placeholder={`e.g. 68 kg`} {...register('weight')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Religion</label>
                                    <select {...register('religion')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none">
                                        <option value="">Select Religion</option>
                                        {RELIGIONS.map(religion => (
                                            <option key={religion} value={religion}>{religion}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Caste</label>
                                    <input placeholder={`e.g. Brahmin`} {...register('caste')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Skin Color</label>
                                    <select {...register('skinColor')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none">
                                        <option value="">Select Complexion</option>
                                        {SKIN_COLOR_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Marital Status</label>
                                    <select {...register('maritalStatus')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none">
                                        {MARITAL_STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>
                        {/* ── Location & Career ── */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-brand-600" /> Location & Career
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                    <input {...register('city')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                                    <input {...register('state')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                                    <input {...register('country')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        <Briefcase className="w-4 h-4 text-brand-500" /> Profession
                                    </label>
                                    <input {...register('profession')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        <GraduationCap className="w-4 h-4 text-brand-500" /> Education
                                    </label>
                                    <input {...register('education')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Annual Income</label>
                                    <input {...register('income')} placeholder="e.g. 10-15 LPA" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                            </div>
                        </section>

                        {/* ── Contact Details ── */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <Phone className="w-5 h-5 mr-2 text-brand-600" /> Contact Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        <Phone className="w-4 h-4 text-brand-500" /> Phone Number
                                    </label>
                                    <input placeholder="e.g. +91 9876543210" {...register('phoneNumber')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4 text-brand-500" /> WhatsApp Number
                                    </label>
                                    <input placeholder="e.g. +91 9876543210" {...register('whatsappNumber')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                                        <Mail className="w-4 h-4 text-brand-500" /> Contact Email
                                    </label>
                                    <input type="email" placeholder="e.g. contact@example.com" {...register('contactEmail')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                            </div>
                        </section>

                        {/* ── About Me ── */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center">
                                <User className="w-5 h-5 mr-2 text-brand-600" /> About Me
                                <span className={`ml-auto text-sm font-normal ${((watch('bio') || '').trim().split(/\s+/).filter(Boolean).length || 0) > 300
                                        ? 'text-red-500 font-bold'
                                        : 'text-gray-400'
                                    }`}>
                                    {(watch('bio') || '').trim().split(/\s+/).filter(Boolean).length || 0}/300 words
                                </span>
                            </h2>
                            <textarea
                                {...register('bio', {
                                    validate: (value) => {
                                        if (!value) return true;
                                        const wordCount = (value || '').trim().split(/\s+/).filter(Boolean).length;
                                        return wordCount <= 300 || 'Bio must be 300 words or less';
                                    }
                                })}
                                rows={4}
                                className={`w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 transition-all resize-none ${((watch('bio') || '').trim().split(/\s+/).filter(Boolean).length || 0) > 300
                                        ? 'border-red-400 focus:ring-red-500'
                                        : 'border-gray-200 focus:ring-brand-500'
                                    }`}
                                placeholder="Tell potential matches about yourself..."
                            />
                            {((watch('bio') || '').trim().split(/\s+/).filter(Boolean).length || 0) > 300 && (
                                <p className="text-red-500 text-xs font-bold">Please reduce your bio to 300 words or less.</p>
                            )}
                        </section>

                        {/* ── Interests ── */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center">
                                <Heart className="w-5 h-5 mr-2 text-brand-600" /> Interests & Hobbies
                                <span className="ml-auto text-sm font-normal text-gray-400">{selectedInterests?.length || 0}/10 selected</span>
                            </h2>
                            <div className="flex flex-wrap gap-3">
                                {INTERESTS_OPTIONS.map(interest => {
                                    const active = selectedInterests?.includes(interest);
                                    return (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => toggleInterest(interest)}
                                            className={`px-5 py-2.5 rounded-2xl font-medium border transition-all text-sm ${active
                                                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-700'
                                                }`}
                                        >
                                            {interest}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ── Family Details ── */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center">
                                <Users className="w-5 h-5 mr-2 text-brand-600" /> Family Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Father's Status</label>
                                    <input {...register('fatherStatus')} placeholder="e.g. Employed, Retired, Passed away" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Mother's Status</label>
                                    <input {...register('motherStatus')} placeholder="e.g. Homemaker, Employed" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Siblings</label>
                                    <input {...register('siblings')} placeholder="e.g. 1 Brother, 2 Sisters" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Family Values</label>
                                    <select {...register('familyValues')} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none">
                                        {FAMILY_VALUES_OPTIONS.map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* ── Photos ── */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center">
                                <Camera className="w-5 h-5 mr-2 text-brand-600" /> Profile Photos
                                <span className="ml-auto text-sm font-normal text-gray-400">Max 3 photos</span>
                            </h2>
                            <div className="grid grid-cols-3 gap-4">
                                {photos.map((url: string, i: number) => (
                                    <div key={i} className="aspect-[3/4] rounded-3xl overflow-hidden shadow-md group relative">
                                        <img src={url} className="w-full h-full object-cover" alt={`Photo ${i + 1}`} />
                                        <button
                                            type="button"
                                            onClick={() => setValue('photos', photos.filter((_, idx) => idx !== i))}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {photos.length < 3 && (
                                    <label className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-brand-50 hover:border-brand-500 transition-all">
                                        {uploadingIdx !== null ? (
                                            <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Camera className="w-6 h-6 text-gray-400 mb-1" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">Add Photo</span>
                                            </>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingIdx !== null} />
                                    </label>
                                )}
                            </div>
                        </section>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full btn-primary py-5 rounded-2xl text-lg flex items-center justify-center shadow-xl shadow-brand-200 disabled:opacity-60"
                        >
                            {saving
                                ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><Save className="mr-2 w-5 h-5" /> Save Changes</>
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
