import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';


const api = axios.create({
    baseURL: API_URL,
});


api.interceptors.request.use((config) => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
        }
    }
    return config;
});

export const authService = {
    login: async (credentials: any) => {
        const response = await api.post('/users/login', credentials);
        return response.data;
    },
    register: async (userData: any) => {
        const response = await api.post('/users/register', userData);
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('/users/forgotpassword', { email });
        return response.data;
    },
    resetPassword: async (token: string, password: string) => {
        const response = await api.put(`/users/resetpassword/${token}`, { password });
        return response.data;
    },
    verifyEmail: async (email: string, code: string) => {
        const response = await api.post('/users/verify-email', { email, code });
        return response.data;
    },
    sendOTP: async (email: string) => {
        const response = await api.post('/users/send-otp', { email });
        return response.data;
    },
    verifyOTP: async (email: string, code: string) => {
        const response = await api.post('/users/verify-otp', { email, code });
        return response.data;
    },
};

export const profileService = {
    getProfiles: async (params?: any) => {
        const response = await api.get('/users/profiles', { params });
        return response.data;
    },
    getProfileById: async (id: string) => {
        const response = await api.get(`/users/profile/${id}`);
        return response.data;
    },
    updateProfile: async (userData: any) => {
        const response = await api.put('/users/profile', userData);
        return response.data;
    },
    toggleShortlist: async (id: string) => {
        const response = await api.post(`/users/shortlist/${id}`);
        return response.data;
    },
    getShortlisted: async () => {
        const response = await api.get('/users/shortlisted');
        return response.data;
    },
    getVisitors: async () => {
        const response = await api.get('/users/visitors');
        return response.data;
    },
    getNotifications: async () => {
        const response = await api.get('/users/notifications');
        return response.data;
    },
    markNotificationRead: async (id: string) => {
        const response = await api.put(`/users/notifications/${id}`);
        return response.data;
    },
    uploadImage: async (formData: FormData) => {
        const response = await api.post('/users/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    sendInterest: async (id: string) => {
        const response = await api.post(`/users/interest/${id}`);
        return response.data;
    },
    handleInterest: async (id: string, status: 'Accepted' | 'Declined') => {
        const response = await api.put(`/users/interest/${id}`, { status });
        return response.data;
    },
    getInterests: async () => {
        const response = await api.get('/users/interests');
        return response.data;
    },
};

export const paymentService = {
    createCheckoutSession: async () => {
        const response = await api.post('/payment/create-checkout-session');
        return response.data;
    },
    verifyPayment: async (data: any) => {
        const response = await api.post('/payment/verify-payment', data);
        return response.data;
    }
};


api.interceptors.response.use(
    (response) => {
        if (response.data && typeof response.data === 'object') {
            const getBaseUrl = (url: string) => {
                if (!url) return '';
                if (url.startsWith('https://') || url.startsWith('http://')) {
                    const match = url.match(/^(https?:\/\/[^\/]+)/);
                    return match ? match[1] : '';
                }
                return '';
            };

            const backOrigin = getBaseUrl(API_URL);

            const normalize = (obj: any): any => {
                if (Array.isArray(obj)) return obj.map(normalize);
                if (obj && typeof obj === 'object') {
                    if (obj._id) {
                        obj.id = obj._id;
                    }
                    Object.keys(obj).forEach(key => {
                        const val = obj[key];
                        // If it's a string starting with /api/ and we have a backend origin, prefix it
                        if (typeof val === 'string' && val.startsWith('/api/') && backOrigin) {
                            obj[key] = `${backOrigin}${val}`;
                        } else if (val && typeof val === 'object') {
                            obj[key] = normalize(val);
                        }
                    });
                }
                return obj;
            };
            response.data = normalize(response.data);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or not provided -> Log out and redirect
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
