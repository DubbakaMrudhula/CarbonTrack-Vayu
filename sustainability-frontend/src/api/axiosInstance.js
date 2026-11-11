import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request interceptor: Attach JWT Bearer token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vayu_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Normalize errors and handle 401 redirect
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    let normalizedError = {
      status: 500,
      message: 'Network error or server unavailable',
      fieldErrors: []
    };

    if (error.response) {
      const { status, data } = error.response;
      normalizedError = {
        status,
        message: data?.message || `Request failed with status ${status}`,
        fieldErrors: Array.isArray(data?.fieldErrors) ? data.fieldErrors : []
      };

      if (status === 401) {
        localStorage.removeItem('vayu_token');
        localStorage.removeItem('vayu_user');
        // Only redirect if not already on login or register
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      normalizedError.message = 'No response from server. Check connection.';
    }

    return Promise.reject(normalizedError);
  }
);

export default axiosInstance;

