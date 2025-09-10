import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatTimeAgo, formatNumber } from '../../utils/helpers';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostCard = ({ post, onPress, onUserPress }) => {
  const { user } = useAuth();
  const { toggleLike } = usePost();
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    await toggleLike(post._id);
    setIsLiking(false);
  };

  const handleDoubleTap = () => {
    if (!post.isLikedByUser) {
      handleLike();
    }
  };

  return (
    <View className="bg-white mb-2">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={() => {
            console.log('PostCard - User tapped:', post.user._id, post.user.username);
            if (onUserPress) {
              onUserPress();
            }
          }}
        >
          <Avatar
            uri={post.user.profilePicture}
            name={post.user.username}
            size={36}
          />
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">
              {post.user.username}
            </Text>
            <Text className="text-gray-500 text-xs">
              {formatTimeAgo(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>

        {user?._id === post.user._id && (
          <TouchableOpacity className="p-2">
            <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Image */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Actions */}
      <View className="px-4 py-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity
              onPress={handleLike}
              disabled={isLiking}
              className="p-1"
            >
              <Ionicons
                name={post.isLikedByUser ? 'heart' : 'heart-outline'}
                size={24}
                color={post.isLikedByUser ? '#EF4444' : '#374151'}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={onPress} className="p-1">
              <Ionicons name="chatbubble-outline" size={24} color="#374151" />
            </TouchableOpacity>

            <TouchableOpacity className="p-1">
              <Ionicons name="paper-plane-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="p-1">
            <Ionicons name="bookmark-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Like Count */}
        {post.likeCount > 0 && (
          <TouchableOpacity className="mb-2">
            <Text className="font-semibold text-gray-900">
              {formatNumber(post.likeCount)} like{post.likeCount !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Caption */}
        {post.caption && (
          <View className="mb-2">
            <Text className="text-gray-900 leading-5">
              <Text className="font-semibold">{post.user.username}</Text>
              {' '}
              {post.caption}
            </Text>
          </View>
        )}

        {/* Comments Preview */}
        {post.commentCount > 0 && (
          <TouchableOpacity onPress={onPress} className="mb-2">
            <Text className="text-gray-500">
              View{post.commentCount > 1 ? `all ${formatNumber(post.commentCount)}` : ''} comment{post.commentCount !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default PostCard;
