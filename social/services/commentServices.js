import { apiClient } from '../utils/api';
import { ENDPOINTS } from '../constants/api';

export const commentService = {
  // Create comment
  async createComment(postId, text, parentCommentId = null) {
    try {
      const response = await apiClient.post(`${ENDPOINTS.COMMENTS}/post/${postId}`, {
        text,
        parentCommentId
      });
      return { success: true, comment: response.data.comment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get comment replies
  async getCommentReplies(commentId, page = 1) {
    try {
      const response = await apiClient.get(`${ENDPOINTS.COMMENTS}/${commentId}/replies?page=${page}`);
      return { 
        success: true, 
        replies: response.data.replies,
        hasMore: response.data.hasMore
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Like/unlike comment
  async toggleCommentLike(commentId) {
    try {
      const response = await apiClient.post(`/likes/comment/${commentId}`);
      return { 
        success: true, 
        isLiked: response.data.isLiked,
        likeCount: response.data.likeCount
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Delete comment
  async deleteComment(commentId) {
    try {
      await apiClient.delete(`${ENDPOINTS.COMMENTS}/${commentId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
