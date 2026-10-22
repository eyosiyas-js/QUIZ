import axios from 'axios';

// Dynamically resolve API URL so it works seamlessly on:
// 1. Unified port 80 / domain / reverse proxy (uses relative '/api')
// 2. Direct server IP on port 3000 (uses 'http://<SERVER_IP>:5000/api')
// 3. Localhost development (uses 'http://localhost:5000/api')
export const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    // When accessed through standard HTTP/HTTPS ports (e.g. via Nginx reverse proxy on port 80 or 443)
    if (!port || port === '80' || port === '443') {
      return '/api';
    }
    // When accessed directly on Next.js port (e.g. 3000), talk to the backend on the SAME server/host on port 5000
    if (port === '3000') {
      return `${protocol}//${hostname}:5000/api`;
    }
    // Fallback for any other custom port behind a proxy
    return '/api';
  }

  // Server-side default
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost:5000')) {
    return envUrl;
  }
  return 'http://localhost:5000/api';
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
