import axios from 'axios';

const API_URL = 'https://vivah1.onrender.com/api';

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
};


api.interceptors.response.use((response) => {
    if (response.data && typeof response.data === 'object') {
        const normalize = (obj: any): any => {
            if (Array.isArray(obj)) return obj.map(normalize);
            if (obj && typeof obj === 'object') {
                if (obj._id) {
                    obj.id = obj._id;
                }
                Object.keys(obj).forEach(key => {
                    if (obj[key] && typeof obj[key] === 'object') {
                        normalize(obj[key]);
                    }
                });
            }
            return obj;
        };
        response.data = normalize(response.data);
    }
    return response;
});

export default api;
