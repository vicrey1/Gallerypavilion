import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';
axios.defaults.withCredentials = true;

// Add response interceptor for handling auth errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        console.log('Attempting to refresh token...');
        const refreshResponse = await axios.post('/auth/refresh');
        console.log('Token refresh successful:', refreshResponse.data);
        processQueue(null);
        return axios(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        
        // Avoid infinite reloads: don't hard-redirect when already on login
        const isAuthMe = typeof originalRequest.url === 'string' && originalRequest.url.includes('/auth/me');
        const onLoginPage = window.location.pathname === '/login';
        if (!isAuthMe && !onLoginPage) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      setUser(response.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return { success: true, user: response.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post('/auth/signup', userData);
      toast.success('Account created! Please wait for admin approval.');
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout fails on server, clear local state
      setUser(null);
      setIsAuthenticated(false);
      toast.error('Logout failed');
    }
  };

  const refreshToken = async () => {
    try {
      await axios.post('/auth/refresh');
      return true;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const isPhotographer = () => {
    return user?.role === 'PHOTOGRAPHER';
  };

  const isApproved = () => {
    return user?.status === 'APPROVED';
  };

  const isPending = () => {
    return user?.status === 'PENDING';
  };

  const isRejected = () => {
    return user?.status === 'REJECTED';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshToken,
    updateUser,
    checkAuth,
    isAdmin,
    isPhotographer,
    isApproved,
    isPending,
    isRejected,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};