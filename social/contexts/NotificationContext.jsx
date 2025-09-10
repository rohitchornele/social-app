import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'LOAD_NOTIFICATIONS_SUCCESS':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        loading: false,
        error: null,
      };
    
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload,
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif._id === action.payload
            ? { ...notif, isRead: true }
            : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
        unreadCount: 0,
      };
    
    case 'DELETE_NOTIFICATION':
      {const deletedNotif = state.notifications.find(n => n._id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif._id !== action.payload),
        unreadCount: deletedNotif && !deletedNotif.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };}
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return initialState;
    
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      fetchUnreadCount();
    } else {
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS);
      
      dispatch({
        type: 'LOAD_NOTIFICATIONS_SUCCESS',
        payload: {
          notifications: response.data.notifications,
          unreadCount: response.data.unreadCount,
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.UNREAD_COUNT);
      dispatch({
        type: 'SET_UNREAD_COUNT',
        payload: response.data.unreadCount,
      });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`${ENDPOINTS.MARK_READ}/${notificationId}/read`);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch(`${ENDPOINTS.NOTIFICATIONS}/mark-all-read`);
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}`);
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const value = {
    ...state,
    loadNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
