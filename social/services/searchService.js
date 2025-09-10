import { apiClient } from '../utils/api';

export const searchService = {
  // Search users
  async searchUsers(query, page = 1, limit = 20) {
    try {
      if (!query || query.trim().length < 2) {
        return { success: true, users: [], hasMore: false };
      }

      const response = await apiClient.get(
        `/users/search/${encodeURIComponent(query.trim())}?page=${page}&limit=${limit}`
      );
      
      return { 
        success: true, 
        users: response.data.users || [],
        hasMore: response.data.hasMore || false,
        totalUsers: response.data.totalUsers || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
