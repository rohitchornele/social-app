import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from "react-native";

import { useAuth } from '../../contexts/AuthContext';
import { usePost } from '../../contexts/PostContext';
import { useUser } from '../../contexts/UserContext';
import { postService } from '../../services/postServices';
import { commentService } from '../../services/commentServices';
import { formatTimeAgo, formatNumber } from '../../utils/helpers';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

const PostDetailScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const { user } = useAuth();
  const { currentPost, getPostById, toggleLike } = usePost();
  const { getUserProfile } = useUser();
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  
  const commentInputRef = useRef(null);

  useEffect(() => {
    loadPostDetails();
  }, [postId]);

  const loadPostDetails = async () => {
    setLoading(true);
    try {
      // Load post details and initial comments using the service
      const result = await postService.getPostWithComments(postId);
      
      if (result.success) {
        // Update post context
        await getPostById(postId);
        setComments(result.comments);
        setCommentsPage(1);
        setHasMoreComments(result.comments.length >= 10); // Assuming 10 per page
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Failed to load post details:', error);
      Alert.alert('Error', 'Failed to load post details');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComments = async () => {
    if (!hasMoreComments || loadingMoreComments) return;

    setLoadingMoreComments(true);
    try {
      const result = await postService.getPostComments(postId, commentsPage + 1);
      
      if (result.success) {
        setComments(prev => [...prev, ...result.comments]);
        setCommentsPage(prev => prev + 1);
        setHasMoreComments(result.hasMore);
      }
    } catch (error) {
      console.error('Failed to load more comments:', error);
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const handleLike = async () => {
    await toggleLike(postId);
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    setCommentLoading(true);
    
    try {
      const result = await commentService.createComment(
        postId, 
        newComment.trim(), 
        replyingTo?._id
      );

      if (result.success) {
        // Add new comment to the list
        if (replyingTo) {
          // Add as a reply
          setComments(prevComments =>
            prevComments.map(comment =>
              comment._id === replyingTo._id
                ? {
                    ...comment,
                    replies: [...(comment.replies || []), result.comment]
                  }
                : comment
            )
          );
        } else {
          // Add as a new top-level comment
          setComments(prevComments => [result.comment, ...prevComments]);
        }

        setNewComment('');
        setReplyingTo(null);
        
        // Show success feedback
        // Toast is handled in the service layer
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    commentInputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleCommentLike = async (commentId) => {
    try {
      const result = await commentService.toggleCommentLike(commentId);
      
      if (result.success) {
        // Update comment like status
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment._id === commentId) {
              return {
                ...comment,
                isLikedByUser: result.isLiked,
                likeCount: result.likeCount
              };
            }
            
            // Check in replies
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply._id === commentId
                    ? {
                        ...reply,
                        isLikedByUser: result.isLiked,
                        likeCount: result.likeCount
                      }
                    : reply
                )
              };
            }
            
            return comment;
          })
        );
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await commentService.deleteComment(commentId);
            if (result.success) {
              setComments(prev => 
                prev.filter(comment => comment._id !== commentId)
                    .map(comment => ({
                      ...comment,
                      replies: comment.replies?.filter(reply => reply._id !== commentId) || []
                    }))
              );
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const handleUserPress = async (userId) => {
    // Pre-load user profile for better UX
    await getUserProfile(userId);
    navigation.navigate('Profile', { userId });
  };

  const handleShowLikes = () => {
    navigation.navigate('PostLikes', { postId });
  };

  const loadMoreReplies = async (commentId) => {
    try {
      const result = await commentService.getCommentReplies(commentId);
      if (result.success) {
        setComments(prevComments =>
          prevComments.map(comment =>
            comment._id === commentId
              ? { ...comment, replies: [...(comment.replies || []), ...result.replies] }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Failed to load replies:', error);
    }
  };

  const renderComment = (comment, isReply = false) => (
    <View
      key={comment._id}
      className={`flex-row space-x-3 ${isReply ? 'ml-10 mt-2' : 'mb-4'}`}
    >
      <TouchableOpacity onPress={() => handleUserPress(comment.user._id)}>
        <Avatar
          uri={comment.user.profilePicture}
          name={comment.user.username}
          size={isReply ? 28 : 32}
        />
      </TouchableOpacity>
      
      <View className="flex-1">
        <View className="bg-gray-100 rounded-2xl px-3 py-2">
          <TouchableOpacity onPress={() => handleUserPress(comment.user._id)}>
            <Text className="font-semibold text-gray-900 text-sm">
              {comment.user.username}
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-900 text-sm leading-5 mt-1">
            {comment.text}
          </Text>
        </View>
        
        <View style={{ display: 'flex', flexDirection:'row', gap:8, marginLeft:10}}>
          <Text className="text-gray-500 text-xs">
            {formatTimeAgo(comment.createdAt)}
          </Text>
          
          <TouchableOpacity className="ml-5" onPress={() => handleCommentLike(comment._id)}>
            <Text className={`text-xs font-medium  ${
              comment.isLikedByUser ? 'text-primary-600' : 'text-gray-500'
            }`}>
              {comment.likeCount > 0 ? `${formatNumber(comment.likeCount)} ` : ''}Like
            </Text>
          </TouchableOpacity>
          
          {!isReply && (
            <TouchableOpacity onPress={() => handleReply(comment)}>
              <Text className="text-gray-500 text-xs font-medium">
                Reply
              </Text>
            </TouchableOpacity>
          )}

          {/* Delete option for own comments */}
          {user?._id === comment.user._id && (
            <TouchableOpacity onPress={() => handleDeleteComment(comment._id)}>
              <Text className="text-red-500 text-xs font-medium">
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <View className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true))}
            
            {/* Load more replies if there are more */}
            {comment.replies.length >= 3 && (
              <TouchableOpacity 
                className="ml-10 mt-2"
                onPress={() => loadMoreReplies(comment._id)}
              >
                <Text className="text-primary-600 text-xs font-medium">
                  View more replies
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (loading || !currentPost) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <LoadingSpinner text="Loading post..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          {/* Post Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <TouchableOpacity
              className="flex-row items-center flex-1"
              onPress={() => handleUserPress(currentPost.user._id)}
            >
              <Avatar
                uri={currentPost.user.profilePicture}
                name={currentPost.user.username}
                size={40}
              />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-gray-900">
                  {currentPost.user.username}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {formatTimeAgo(currentPost.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>

            {user?._id === currentPost.user._id && (
              <TouchableOpacity className="p-2">
                <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Post Image */}
          <Image
            source={{ uri: currentPost.imageUrl }}
            style={{ width: '100%', aspectRatio: 1 }}
            resizeMode="cover"
          />

          {/* Post Actions & Info */}
          <View className="px-4 py-3 border-b border-gray-100">
            {/* Actions Row */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center space-x-4">
                <TouchableOpacity onPress={handleLike} className="p-1">
                  <Ionicons
                    name={currentPost.isLikedByUser ? 'heart' : 'heart-outline'}
                    size={28}
                    color={currentPost.isLikedByUser ? '#EF4444' : '#374151'}
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => commentInputRef.current?.focus()}
                  className="p-1"
                >
                  <Ionicons name="chatbubble-outline" size={28} color="#374151" />
                </TouchableOpacity>

                <TouchableOpacity className="p-1">
                  <Ionicons name="paper-plane-outline" size={28} color="#374151" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity className="p-1">
                <Ionicons name="bookmark-outline" size={28} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Like Count */}
            {currentPost.likeCount > 0 && (
              <TouchableOpacity className="mb-3" onPress={handleShowLikes}>
                <Text className="font-semibold text-gray-900">
                  {formatNumber(currentPost.likeCount)} like{currentPost.likeCount !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}

            {/* Caption */}
            {currentPost.caption && (
              <View className="mb-3">
                <Text className="text-gray-900 leading-5">
                  <TouchableOpacity onPress={() => handleUserPress(currentPost.user._id)}>
                    <Text className="font-semibold">{currentPost.user.username}</Text>
                  </TouchableOpacity>
                  {' '}
                  {currentPost.caption}
                </Text>
              </View>
            )}
          </View>

          {/* Comments Section */}
          <View className="px-4 py-4">
            <Text className="font-semibold text-gray-900 text-lg mb-4">
              Comments ({formatNumber(comments.length)})
            </Text>
            
            {comments.length > 0 ? (
              <View>
                {comments.map(comment => renderComment(comment))}
                
                {/* Load More Comments */}
                {hasMoreComments && (
                  <View className="items-center py-4">
                    {loadingMoreComments ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <TouchableOpacity onPress={loadMoreComments}>
                        <Text className="text-primary-600 font-medium">
                          Load more comments
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View className="items-center py-8">
                <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2">No comments yet</Text>
                <Text className="text-gray-400 text-sm">Be the first to comment</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View className="border-t border-gray-200 bg-white">
          {replyingTo && (
            <View className="px-4 py-2 bg-gray-50 flex-row items-center justify-between">
              <Text className="text-gray-600 text-sm">
                Replying to <Text className="font-semibold">{replyingTo.user.username}</Text>
              </Text>
              <TouchableOpacity onPress={cancelReply}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
          
          <View className="flex-row items-center px-4 py-3 space-x-3">
            <Avatar
              uri={user?.profilePicture}
              name={user?.username}
              size={32}
            />
            
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <TextInput
                ref={commentInputRef}
                value={newComment}
                onChangeText={setNewComment}
                placeholder={replyingTo ? `Reply to ${replyingTo.user.username}...` : "Add a comment..."}
                className="flex-1 text-gray-900"
                multiline
                maxLength={500}
              />
              
              {newComment.trim() && (
                <TouchableOpacity 
                  onPress={handleComment}
                  disabled={commentLoading}
                  className="ml-2"
                >
                  {commentLoading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <Ionicons name="send" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostDetailScreen;
