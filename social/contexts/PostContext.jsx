import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { apiClient } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import Toast from 'react-native-toast-message';
import { userService } from '../services/userServices';

const PostContext = createContext();

const initialState = {
  posts: [],
  followingPosts: [], // Add this for following feed
  currentPost: null,
  loading: false,
  refreshing: false,
  hasMore: true,
  hasMoreFollowing: true, // Add this
  page: 1,
  followingPage: 1, // Add this
  error: null,
  feedType: 'all', // 'all' or 'following'
};


const postReducer = (state, action) => {
  switch (action.type) {

    case 'SET_FEED_TYPE':
      return { ...state, feedType: action.payload };

    case 'LOAD_FOLLOWING_POSTS_SUCCESS':
      {
        // Similar logic for following posts
        const newFollowingPosts = action.payload.posts || [];

        if (action.payload.isRefresh) {
          return {
            ...state,
            followingPosts: action.payload.isRefresh
              ? action.payload.posts
              : [...state.followingPosts, ...action.payload.posts],
            hasMoreFollowing: action.payload.hasMore,
            // followingPage: 2,
            loading: false,
            refreshing: false,
            error: null,
          };
        } else {
          const existingFollowingIds = new Set(state.followingPosts.map(p => p._id));
          const uniqueNewFollowingPosts = newFollowingPosts.filter(post => !existingFollowingIds.has(post._id));

          return {
            ...state,
            followingPosts: [...state.followingPosts, ...uniqueNewFollowingPosts],
            hasMoreFollowing: action.payload.hasMore,
            followingPage: state.followingPage + 1,
            loading: false,
            refreshing: false,
            error: null,
          };
        }
      }

    case 'CLEAR_FOLLOWING_POSTS':
      return {
        ...state,
        followingPosts: [],
        hasMoreFollowing: true,
        followingPage: 1,
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };

    case 'LOAD_POSTS_SUCCESS':
      {
        const newPosts = action.payload.posts || [];

        if (action.payload.isRefresh) {
          // On refresh, replace all posts
          return {
            ...state,
            posts: newPosts,
            hasMore: action.payload.hasMore,
            page: 2,
            loading: false,
            refreshing: false,
            error: null,
          };
        } else {
          // On load more, add only unique posts
          const existingIds = new Set(state.posts.map(p => p._id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post._id));

          return {
            ...state,
            posts: [...state.posts, ...uniqueNewPosts],
            hasMore: action.payload.hasMore,
            page: state.page + 1,
            loading: false,
            refreshing: false,
            error: null,
          };
        }
      }
    case 'CREATE_POST_SUCCESS':
      return {
        ...state,
        posts: [action.payload, ...state.posts],
      };

    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post =>
          post._id === action.payload._id ? action.payload : post
        ),
        currentPost: state.currentPost?._id === action.payload._id
          ? action.payload : state.currentPost,
      };

    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post._id !== action.payload),
      };

    case 'SET_CURRENT_POST':
      return {
        ...state,
        currentPost: action.payload,
      };

    case 'UPDATE_LIKE_STATUS':
      return {
        ...state,
        posts: state.posts.map(post =>
          post._id === action.payload.postId
            ? {
              ...post,
              isLikedByUser: action.payload.isLiked,
              likeCount: action.payload.likeCount,
            }
            : post
        ),
        currentPost: state.currentPost?._id === action.payload.postId
          ? {
            ...state.currentPost,
            isLikedByUser: action.payload.isLiked,
            likeCount: action.payload.likeCount,
          }
          : state.currentPost,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
        refreshing: false,
      };

    case 'CLEAR_POSTS':
      return {
        ...initialState,
      };

    default:
      return state;
  }
};

export const PostProvider = ({ children }) => {
  const [state, dispatch] = useReducer(postReducer, initialState);

  const loadPosts = useCallback(async (isRefresh = false) => {
    if (!isRefresh && (state.loading || !state.hasMore)) return;

    dispatch({ type: isRefresh ? 'SET_REFRESHING' : 'SET_LOADING', payload: true });

    try {
      const page = isRefresh ? 1 : state.page;
      const response = await apiClient.get(`${ENDPOINTS.POSTS}?page=${page}&limit=10`);

      dispatch({
        type: 'LOAD_POSTS_SUCCESS',
        payload: {
          posts: response.data.posts,
          hasMore: response.data.pagination.hasNext,
          isRefresh,
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [state.loading, state.hasMore, state.page]);

  const createPost = async (postData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const formData = new FormData();
      formData.append('image', {
        uri: postData.imageUri,
        type: 'image/jpeg',
        name: 'post-image.jpg',
      });

      if (postData.caption) {
        formData.append('caption', postData.caption);
      }

      const response = await apiClient.post(ENDPOINTS.POSTS, formData, {
        isFormData: true,
      });

      dispatch({
        type: 'CREATE_POST_SUCCESS',
        payload: response.data.post,
      });

      Toast.show({
        type: 'success',
        text1: 'Post created!',
        text2: 'Your photo has been shared',
      });

      return { success: true, post: response.data.post };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getPostById = async (postId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiClient.get(`${ENDPOINTS.POSTS}/${postId}`);

      dispatch({
        type: 'SET_CURRENT_POST',
        payload: response.data.post,
      });

      return { success: true, post: response.data.post };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const toggleLike = async (postId) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.LIKE_POST}/${postId}`);

      dispatch({
        type: 'UPDATE_LIKE_STATUS',
        payload: {
          postId,
          isLiked: response.data.isLiked,
          likeCount: response.data.likeCount,
        },
      });

      return { success: true };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  const deletePost = async (postId) => {
    try {
      await apiClient.delete(`${ENDPOINTS.POSTS}/${postId}`);

      dispatch({
        type: 'DELETE_POST',
        payload: postId,
      });

      Toast.show({
        type: 'success',
        text1: 'Post deleted',
        text2: 'Your post has been removed',
      });

      return { success: true };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  const refreshPosts = () => loadPosts(true);
  const loadMorePosts = () => loadPosts(false);

  const clearPosts = () => {
    dispatch({ type: 'CLEAR_POSTS' });
  };

  const loadFollowingFeed = useCallback(async (isRefresh = false) => {
    console.log('🔍 PostContext - loadFollowingFeed called:', { isRefresh, loading: state.loading, hasMore: state.hasMoreFollowing });

    if (!isRefresh && (state.loading || !state.hasMoreFollowing)) {
      console.log('❌ PostContext - Skipping load (loading or no more)');
      return;
    }

    dispatch({ type: isRefresh ? 'SET_REFRESHING' : 'SET_LOADING', payload: true });

    try {
      const page = isRefresh ? 1 : state.followingPage;
      console.log('📡 PostContext - Fetching following feed, page:', page);

      const result = await userService.getFollowingFeed(page, 10);
      console.log('📥 PostContext - Following feed API result:', result);

      if (result.success) {
        console.log('✅ PostContext - Dispatching following posts:', result.posts.length);
        dispatch({
          type: 'LOAD_FOLLOWING_POSTS_SUCCESS',
          payload: {
            posts: result.posts,
            hasMore: result.pagination?.hasNext || false,
            isRefresh,
          },
        });
      } else {
        console.error('❌ PostContext - Following feed failed:', result.error);
      }
    } catch (error) {
      console.error('💥 PostContext - Following feed exception:', error);
    }
  }, [state.loading, state.hasMoreFollowing, state.followingPage]);

  const refreshFollowingFeed = () => loadFollowingFeed(true);
  const loadMoreFollowingFeed = () => loadFollowingFeed(false);

  const switchFeedType = (feedType) => {
    dispatch({ type: 'SET_FEED_TYPE', payload: feedType });
    if (feedType === 'following' && state.followingPosts.length === 0) {
      loadFollowingFeed(true);
    }
  };

  const clearFollowingFeed = () => {
    dispatch({ type: 'CLEAR_FOLLOWING_POSTS' });
  };


  const value = {
    ...state,
    loadPosts,
    createPost,
    getPostById,
    toggleLike,
    deletePost,
    refreshPosts,
    loadMorePosts,
    clearPosts,
    loadFollowingFeed,
    refreshFollowingFeed,
    loadMoreFollowingFeed,
    switchFeedType,
    clearFollowingFeed,
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};
