import { apiClient } from '../utils/api';
import { ENDPOINTS } from '../constants/api';

export const postService = {
  // Get post with comments
  async getPostWithComments(postId) {
    try {
      const [postResponse, commentsResponse] = await Promise.all([
        apiClient.get(`${ENDPOINTS.POSTS}/${postId}`),
        apiClient.get(`${ENDPOINTS.POSTS}/${postId}/comments`)
      ]);

      return { 
        success: true, 
        post: postResponse.data.post,
        comments: commentsResponse.data.comments
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get post comments with pagination
  async getPostComments(postId, page = 1) {
    try {
      const response = await apiClient.get(`${ENDPOINTS.POSTS}/${postId}/comments?page=${page}`);
      return { 
        success: true, 
        comments: response.data.comments,
        hasMore: response.data.pagination.hasMore,
        totalComments: response.data.pagination.totalComments
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get post likes
  async getPostLikes(postId, page = 1) {
    try {
      const response = await apiClient.get(`${ENDPOINTS.POSTS}/${postId}/likes?page=${page}`);
      return { 
        success: true, 
        likes: response.data.likes,
        hasMore: response.data.hasMore,
        totalLikes: response.data.totalLikes
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
