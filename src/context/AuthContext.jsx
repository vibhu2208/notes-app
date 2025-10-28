/**
 * Authentication context
 * Manages user authentication state and provides auth methods
 */

import { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

// Auth reducer for state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get user profile with existing token
          const response = await authService.getProfile();
          dispatch({ type: 'SET_USER', payload: response.data.user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        // Token might be invalid, clear it
        localStorage.removeItem('accessToken');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      dispatch({ type: 'SET_USER', payload: response.data.user });
      toast.success('Login successful!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      dispatch({ type: 'SET_USER', payload: response.data.user });
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout fails on server, clear local state
      dispatch({ type: 'LOGOUT' });
      toast.error('Logout failed, but you have been logged out locally');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      toast.success('Profile updated successfully');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Profile update failed';
      throw new Error(errorMessage);
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      toast.success('Password changed successfully');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Password change failed';
      throw new Error(errorMessage);
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
