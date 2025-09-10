import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Avatar from '../ui/Avatar';
import { formatNumber } from '../../utils/helpers';
import { Ionicons } from '@expo/vector-icons';

const UserListItem = ({ user, onPress, showFollowButton = false, onFollowPress }) => {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 bg-white"
      onPress={() => onPress(user._id)}
    >
      <Avatar
        uri={user.profilePicture}
        name={user.username}
        size={50}
      />
      
      <View className="flex-1 ml-3">
        <Text className="font-semibold text-gray-900 text-base">
          {user.username}
        </Text>
        {user.bio && (
          <Text className="text-gray-600 text-sm mt-1" numberOfLines={1}>
            {user.bio}
          </Text>
        )}
        <View className="flex-row items-center mt-1">
          <Text className="text-gray-500 text-xs">
            {formatNumber(user.followerCount || 0)} followers
          </Text>
        </View>
      </View>

      {showFollowButton && (
        <TouchableOpacity
          onPress={() => onFollowPress && onFollowPress(user)}
          className={`px-4 py-2 rounded-lg ${
            user.isFollowing 
              ? 'bg-gray-200 border border-gray-300' 
              : 'bg-primary-600'
          }`}
        >
          <Text className={`font-medium text-sm ${
            user.isFollowing ? 'text-gray-700' : 'text-white'
          }`}>
            {user.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default UserListItem;
