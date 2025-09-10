import React, { createContext, useContext, useReducer } from 'react';
import { userService } from '../services/userServices';
import Toast from 'react-native-toast-message';

const UserContext = createContext();

const initialState = {
  currentProfile: null,
  userPosts: [],
  followers: [],
  following: [],
  loading: false,
  error: null,
};

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_PROFILE':
      return { ...state, currentProfile: action.payload, loading: false };

    case 'SET_USER_POSTS':
      return {
        ...state,
        userPosts: action.payload.replace ? action.payload.posts : [...state.userPosts, ...action.payload.posts],
        loading: false
      };

    case 'UPDATE_FOLLOW_STATUS':
      return {
        ...state,
        currentProfile: state.currentProfile ? {
          ...state.currentProfile,
          isFollowing: action.payload.isFollowing,
          followers: action.payload.isFollowing
            ? [...(state.currentProfile.followers || []), { _id: 'temp' }]
            : (state.currentProfile.followers || []).slice(0, -1),
          showFollowBackMessage: action.payload.isFollowBack
        } : null
      };

    case 'SET_FOLLOWERS':
      return {
        ...state,
        followers: action.payload.replace ? action.payload.followers : [...state.followers, ...action.payload.followers]
      };

    case 'SET_FOLLOWING':
      return {
        ...state,
        following: action.payload.replace ? action.payload.following : [...state.following, ...action.payload.following]
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_PROFILE':
      return initialState;



    default:
      return state;
  }
};

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const getUserProfile = async (userId) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const result = await userService.getUserById(userId);
    if (result.success) {
      dispatch({ type: 'SET_PROFILE', payload: result.user });
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    }

    return result;
  };

  const getUserPosts = async (userId, page = 1, replace = false) => {
    if (page === 1 || replace) {
      dispatch({ type: 'SET_LOADING', payload: true });
    }

    const result = await userService.getUserPosts(userId, page);
    if (result.success) {
      dispatch({
        type: 'SET_USER_POSTS',
        payload: { posts: result.posts, replace }
      });
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    }

    return result;
  };

const followUser = async (userId) => {
    const result = await userService.followUser(userId);
    if (result.success) {
      dispatch({ 
        type: 'UPDATE_FOLLOW_STATUS', 
        payload: { 
          isFollowing: true,
          followerCount: result.followerCount,
          isFollowBack: result.isFollowBack
        }
      });
      
      Toast.show({
        type: 'success',
        text1: result.isFollowBack ? 'Following Each Other!' : 'Following',
        text2: result.message
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Follow failed',
        text2: result.error
      });
    }
    return result;
  };

  const unfollowUser = async (userId) => {
    const result = await userService.unfollowUser(userId);
    if (result.success) {
      dispatch({ 
        type: 'UPDATE_FOLLOW_STATUS', 
        payload: { 
          isFollowing: false,
          followerCount: result.followerCount
        }
      });
      
      Toast.show({
        type: 'success',
        text1: 'Unfollowed',
        text2: result.message
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Unfollow failed',
        text2: result.error
      });
    }
    return result;
  };

  const getFollowers = async (userId, page = 1, replace = false) => {
    const result = await userService.getFollowers(userId, page);
    if (result.success) {
      dispatch({
        type: 'SET_FOLLOWERS',
        payload: { followers: result.followers, replace }
      });
    }
    return result;
  };

  const getFollowing = async (userId, page = 1, replace = false) => {
    const result = await userService.getFollowing(userId, page);
    if (result.success) {
      dispatch({
        type: 'SET_FOLLOWING',
        payload: { following: result.following, replace }
      });
    }
    return result;
  };

  const uploadProfilePicture = async (imageUri) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const result = await userService.uploadProfilePicture(imageUri);
    if (result.success) {
      dispatch({ type: 'SET_PROFILE', payload: result.user });
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Profile picture updated successfully'
      });
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: result.error
      });
    }

    return result;
  };

  const clearProfile = () => {
    dispatch({ type: 'CLEAR_PROFILE' });
  };

  const value = {
    ...state,
    getUserProfile,
    getUserPosts,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    uploadProfilePicture,
    clearProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
