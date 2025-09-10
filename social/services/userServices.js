import { apiClient } from '../utils/api';
import { ENDPOINTS } from '../constants/api';

export const userService = {
  // Get user profile by ID
  async getUserById(userId) {
    try {
      console.log('UserService - getUserById called with:', userId);
      const response = await apiClient.get(`/users/${userId}`);
      console.log('UserService - getUserById response:', response);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('UserService - getUserById error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return { success: true, user: response.data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Upload profile picture
  async uploadProfilePicture(imageUri) {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      });

      const response = await apiClient.post('/users/profile/picture', formData, {
        isFormData: true,
      });
      return { success: true, user: response.data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get user posts
  async getUserPosts(userId, page = 1, limit = 12) {
    try {
      const response = await apiClient.get(`/users/${userId}/posts?page=${page}&limit=${limit}`);
      return { 
        success: true, 
        posts: response.data.posts,
        hasMore: response.data.hasMore,
        totalPosts: response.data.totalPosts
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Follow user
async followUser(userId) {
    try {
      const response = await apiClient.post(`/users/${userId}/follow`);
      return { 
        success: true, 
        isFollowing: response.data.isFollowing,
        isFollowBack: response.data.isFollowBack,
        followerCount: response.data.followerCount,
        message: response.data.message
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Unfollow user
  async unfollowUser(userId) {
    try {
      const response = await apiClient.delete(`/users/${userId}/follow`);
      return { 
        success: true, 
        isFollowing: response.data.isFollowing,
        followerCount: response.data.followerCount,
        message: response.data.message
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get following feed
  async getFollowingFeed(page = 1, limit = 10) {
    try {
      const response = await apiClient.get(`/users/feed/following?page=${page}&limit=${limit}`);
      return { 
        success: true, 
        posts: response.data.posts,
        pagination: response.data.pagination
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get followers
 // Get followers with pagination
  async getFollowers(userId, page = 1, limit = 20) {
    try {
      const response = await apiClient.get(`/users/${userId}/followers?page=${page}&limit=${limit}`);
      return { 
        success: true, 
        followers: response.data.followers || [],
        hasMore: response.data.hasMore || false,
        totalFollowers: response.data.totalFollowers || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get following with pagination
  async getFollowing(userId, page = 1, limit = 20) {
    try {
      const response = await apiClient.get(`/users/${userId}/following?page=${page}&limit=${limit}`);
      return { 
        success: true, 
        following: response.data.following || [],
        hasMore: response.data.hasMore || false,
        totalFollowing: response.data.totalFollowing || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Search users
  async searchUsers(query, page = 1) {
    try {
      const response = await apiClient.get(`/users/search/${encodeURIComponent(query)}?page=${page}`);
      return { 
        success: true, 
        users: response.data.users,
        hasMore: response.data.hasMore,
        totalUsers: response.data.totalUsers
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  
};
