import React from 'react';
import type { UserProfile } from '../types';
import { MapPin, Briefcase, CheckCircle2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface ProfileCardProps {
    profile: UserProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    
    // Support both ID formats as a safety measure
    const profileId = profile.id || (profile as any)._id;
    const isShortlisted = currentUser?.shortlisted?.includes(profileId || '');

    const shortlistMutation = useMutation({
        mutationFn: () => profileService.toggleShortlist(profileId!),
        onSuccess: (_data: any) => {
            useAuthStore.getState().toggleShortlistStore(profileId!);
            queryClient.invalidateQueries({ queryKey: ['shortlisted'] });
            // Alerting in card might be noisy, let's just use the state for now
            // alert(data.message || 'Shortlist updated!');
        },
        onError: (err: any) => {
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    });

    const handleShortlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        shortlistMutation.mutate();
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="card-premium group relative bg-white"
        >
            <Link to={`/profile/${profileId}`} className="block">
                <div className="aspect-[3/4] overflow-hidden relative rounded-t-[2rem]">
                    <img
                        src={profile.photos?.[0] || 'https://via.placeholder.com/400x600?text=No+Photo'}
                        alt={profile.fullName || 'User'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {profile.isVerified && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-1.5 border border-white/30">
                            <CheckCircle2 className="w-5 h-5 text-white fill-brand-600" />
                        </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="text-xl font-bold font-display">{profile.fullName}, {profile.age}</h3>
                        <div className="flex items-center space-x-2 text-sm opacity-90">
                            <span>{profile.height}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-3">
                    <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-brand-500" />
                        {profile.location?.city || 'N/A'}, {profile.location?.state || 'N/A'}
                    </div>
                    <div className="flex items-center text-gray-600 text-sm">
                        <Briefcase className="w-4 h-4 mr-2 text-brand-500" />
                        {profile.profession || 'N/A'}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                        <span className="text-brand-600 font-semibold text-sm hover:underline">
                            View Full Profile
                        </span>
                        <button 
                            onClick={handleShortlistToggle}
                            disabled={shortlistMutation.isPending}
                            className={`p-2 rounded-full transition-all duration-300 ${isShortlisted 
                                ? 'bg-brand-50 text-brand-600' 
                                : 'hover:bg-brand-50 text-gray-400 hover:text-brand-600'
                            }`}
                        >
                            <Heart className={`w-5 h-5 ${isShortlisted ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};
