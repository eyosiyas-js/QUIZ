import axios from 'axios';

// Create a centralized Axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = token;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor to handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        // Only redirect if we are not already on auth pages
        const isAuthPage = window.location.pathname === '/login' || 
                           window.location.pathname === '/signup' ||
                           window.location.pathname === '/admin' ||
                           window.location.pathname === '/al';
                           
        if (!isAuthPage) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
