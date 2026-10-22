import axios from 'axios';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    // If running directly on Vite dev server (5173), point to backend on the same host:5000
    if (port === '5173') {
      return `${protocol}//${hostname}:5000/api`;
    }
    // Running in Docker on port 8080 or behind reverse proxy: use relative /api
    return '/api';
  }
  return '/api';
};

const client = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request and ensure dynamic baseURL
client.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Handle 401/403 responses globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token');
      const adminLogin = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
      window.location.href = adminLogin;
    }
    return Promise.reject(error);
  }
);

export default client;
