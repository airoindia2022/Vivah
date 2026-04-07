import { useState } from 'react';
import { Search as SearchIcon, X, LayoutGrid, List } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { profileService } from '../services/api';
import type { UserProfile } from '../types';
import { ProfileCard } from '../components/ProfileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { RELIGIONS } from '../data/constants';

export const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const defaultFilters = {
        gender: 'All',
        ageMin: 18,
        ageMax: 50,
        religion: 'All',
        city: 'All'
    };

    const [filters, setFilters] = useState({
        gender: searchParams.get('gender') || 'All',
        ageMin: Number(searchParams.get('ageMin')) || 18,
        ageMax: Number(searchParams.get('ageMax')) || 50,
        religion: searchParams.get('religion') || 'All',
        city: 'All'
    });

    const resetFilters = () => {
        setFilters(defaultFilters);
        setSearchQuery('');
    };

    const { data: profiles, isLoading, error } = useQuery<UserProfile[]>({
        queryKey: ['profiles', filters, searchQuery],
        queryFn: () => profileService.getProfiles({
            ...filters,
            search: searchQuery
        }),
    });

    const locations = ['All', 'Delhi', 'Mumbai', 'Bangalore', 'Chandigarh', 'Hyderabad', 'Chennai', 'Pune', 'Goa'];

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="bg-white border-b border-gray-100 sticky top-16 z-30 px-4 py-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-grow max-w-2xl">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by profile name, education or profession..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none text-gray-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-3">


                        <div className="hidden sm:flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setView('grid')}
                                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 lg:flex gap-8">
                {/* Desktop Sidebar Filters */}
                <aside className="hidden lg:block w-72 shrink-0 space-y-8">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-40">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-xl">Filters</h3>
                            <button onClick={resetFilters} className="text-sm text-brand-600 font-semibold hover:underline">Reset</button>
                        </div>

                        <div className="space-y-6">
                            <div className="pt-0 border-gray-100">
                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-3">Location</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                                    value={filters.city}
                                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                >
                                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-3">Religion</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                                    value={filters.religion}
                                    onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
                                >
                                    <option value="All">All Religions</option>
                                    {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-3">Age Range</label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Min"
                                        value={filters.ageMin}
                                        onChange={(e) => setFilters({ ...filters, ageMin: parseInt(e.target.value) || 18 })}
                                    />
                                    <span className="text-gray-400">to</span>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Max"
                                        value={filters.ageMax}
                                        onChange={(e) => setFilters({ ...filters, ageMax: parseInt(e.target.value) || 70 })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Profiles Grid */}
                <main className="flex-grow">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold font-display">
                            Showing Profiles
                        </h2>

                    </div>

                    <div className={`grid gap-8 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                        {isLoading && (
                            <div className="col-span-full py-20 text-center">
                                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">Finding your matches...</p>
                            </div>
                        )}
                        {error && (
                            <div className="col-span-full py-20 text-center text-red-500">
                                Failed to load profiles. Please try again later.
                            </div>
                        )}
                        {Array.isArray(profiles) && profiles.map((profile: UserProfile, i: number) => (
                            <ProfileCard key={`${profile.id}-${i}`} profile={profile} />
                        ))}
                        {Array.isArray(profiles) && profiles.length === 0 && !isLoading && (
                            <div className="col-span-full py-20 text-center text-gray-500">
                                No profiles found matching your criteria.
                            </div>
                        )}
                    </div>

                    <div className="mt-16 py-10 text-center">
                        <div className="inline-flex items-center p-1 bg-white border border-gray-200 rounded-2xl shadow-sm">
                            <button className="px-4 py-2 text-gray-400 cursor-not-allowed">Previous</button>
                            <div className="flex px-2">
                                {[1, 2, 3, 4].map(num => (
                                    <button key={num} className={`w-10 h-10 rounded-xl font-bold transition-all ${num === 1 ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <button className="px-4 py-2 text-brand-600 font-bold hover:bg-brand-50 rounded-xl transition-all">Next</button>
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Filters Overlay */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden flex justify-end"
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-sm bg-white h-full overflow-y-auto p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold font-display">Filters</h3>
                                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-grow space-y-8">
                                {/* Same filters as desktop */}
                                <div>
                                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-4">Age Range</label>
                                    <div className="flex items-center space-x-4">
                                        <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none">
                                            {[...Array(33)].map((_, i) => <option key={i + 18}>{i + 18}</option>)}
                                        </select>
                                        <span className="text-gray-400">to</span>
                                        <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none">
                                            {[...Array(33)].map((_, i) => <option key={i + 18} selected={i === 12}>{i + 18}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-4">Religion</label>
                                    <select 
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
                                        value={filters.religion}
                                        onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
                                    >
                                        <option value="All">All Religions</option>
                                        {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-8 grid grid-cols-2 gap-4 sticky bottom-0 bg-white">
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="py-4 rounded-2xl border border-gray-200 font-bold text-gray-700"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="btn-primary py-4 rounded-2xl shadow-lg shadow-brand-200"
                                >
                                    Show Results
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
