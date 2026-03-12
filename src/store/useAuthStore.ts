import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/api';

interface User {
    _id: string;
    fullName: string;
    email: string;
    gender: string;
    age: number;
    photos: string[];
    subscriptionTier: string;
    shortlisted: string[];
    location?: { city: string };
    profession?: string;
    education?: string;
    bio?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    contactEmail?: string;
    isAdmin?: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (credentials: any) => Promise<any>;
    register: (userData: any) => Promise<any>;
    verifyEmailCode: (email: string, code: string) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    toggleShortlistStore: (id: string) => void;
    setAuth: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: async (credentials) => {
                try {
                    const data = await authService.login(credentials);
                    if (!data.requiresVerification) {
                        set({
                            user: data,
                            token: data.token,
                            isAuthenticated: true
                        });
                    }
                    return data;
                } catch (error: any) {
                    throw error;
                }
            },
            register: async (userData) => {
                try {
                    const data = await authService.register(userData);
                    // Registration now always requires verification
                    return data;
                } catch (error: any) {
                    throw error;
                }
            },
            verifyEmailCode: async (email, code) => {
                try {
                    const data = await authService.verifyEmail(email, code);
                    set({
                        user: data,
                        token: data.token,
                        isAuthenticated: true
                    });
                } catch (error: any) {
                    throw error;
                }
            },
            setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null
                })),
            toggleShortlistStore: (id) =>
                set((state) => ({
                    user: state.user ? {
                        ...state.user,
                        shortlisted: state.user.shortlisted?.includes(id)
                            ? state.user.shortlisted.filter(sid => sid !== id)
                            : [...(state.user.shortlisted || []), id]
                    } : null
                })),
        }),
        {
            name: 'auth-storage',
        }
    )
);
