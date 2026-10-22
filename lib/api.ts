import axios from 'axios';

// Dynamically resolve API URL using relative '/api', which works seamlessly:
// - Behind Nginx (port 80 / 443 / domain / server IP)
// - Directly on Next.js (port 3000 via next.config.mjs rewrites)
// - Local development
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  // Server-side rendering default
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost:5000')) {
    return envUrl;
  }
  return '/api';
};

// Create a centralized Axios instance
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token and ensure dynamic baseURL
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      config.baseURL = getBaseUrl();
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
