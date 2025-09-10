import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { storage } from '../utils/storage';
import { ENDPOINTS } from '../constants/api';
import Toast from 'react-native-toast-message';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await storage.getAccessToken();
      const userData = await storage.getUserData();

      if (token && userData) {
        // Verify token is still valid by fetching user profile
        try {
          const response = await apiClient.get(ENDPOINTS.PROFILE);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: response.data.user }
          });
        } catch (error) {
          // Token invalid, clear storage
          await storage.clearAll();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.post(ENDPOINTS.REGISTER, userData, {
        includeAuth: false
      });

      const { user, accessToken, refreshToken } = response.data;

      await storage.setTokens(accessToken, refreshToken);
      await storage.setUserData(user);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user }
      });

      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Account created successfully',
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.post(ENDPOINTS.LOGIN, credentials, {
        includeAuth: false
      });

      const { user, accessToken, refreshToken } = response.data;

      await storage.setTokens(accessToken, refreshToken);
      await storage.setUserData(user);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user }
      });

      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Hello ${user.username}`,
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post(ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await storage.clearAll();
      dispatch({ type: 'LOGOUT' });
      
      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'See you soon!',
      });
    }
  };

 const updateProfile = async (profileData) => {
    try {
      // Change from ENDPOINTS.PROFILE to the correct user profile endpoint
      const response = await apiClient.put(ENDPOINTS.UPDATE_PROFILE, profileData);
      
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      });

      await storage.setUserData(response.data.user);

      Toast.show({
        type: 'success',
        text1: 'Profile updated',
        text2: 'Your changes have been saved',
      });

      return { success: true };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: error.message,
      });
      return { success: false, error: error.message };
    }
  };


  const value = {
    ...state,
    register,
    login,
    logout,
    updateProfile,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
