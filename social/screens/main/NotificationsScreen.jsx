import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotification } from '../../contexts/NotificationContext';
import { formatTimeAgo } from '../../utils/helpers';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

const NotificationsScreen = ({ navigation }) => {
  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotification();

//   useEffect(() => {
//     loadNotifications();
//   }, []);

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      navigation.navigate('PostDetail', { postId: notification.relatedPost._id });
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      className={`
        px-4 py-4 border-b border-gray-100
        ${!item.isRead ? 'bg-blue-50' : 'bg-white'}
      `}
      onPress={() => handleNotificationPress(item)}
    >
      <View className="flex-row items-start space-x-3">
        <Avatar
          uri={item.sender.profilePicture}
          name={item.sender.username}
          size={44}
        />
        
        <View className="flex-1">
          <Text className="text-gray-900 text-sm leading-5">
            <Text className="font-semibold">{item.sender.username}</Text>
            {' '}
            {item.type === 'like' && 'liked your post'}
            {item.type === 'comment' && 'commented on your post'}
            {item.type === 'follow' && 'started following you'}
          </Text>
          
          <Text className="text-gray-500 text-xs mt-1">
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          {!item.isRead && (
            <View className="w-2 h-2 bg-primary-600 rounded-full" />
          )}
          
          {item.relatedPost && (
            <Image
              source={{ uri: item.relatedPost.imageUrl }}
              className="w-10 h-10 rounded"
            />
          )}
          
          <TouchableOpacity
            onPress={() => deleteNotification(item._id)}
            className="p-1"
          >
            <Ionicons name="close" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) {
      return <LoadingSpinner text="Loading notifications..." />;
    }

    return (
      <View className="flex-1 items-center justify-center px-8 py-12">
        <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-medium text-gray-900 mt-4 mb-2 text-center">
          No notifications
        </Text>
        <Text className="text-gray-600 text-center">
          When someone likes or comments on your posts, you'll see it here
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{paddingHorizontal: 5, paddingVertical: 5}}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-semibold text-gray-900">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Button
              title="Mark all read"
              variant="ghost"
              size="small"
              onPress={markAllAsRead}
            />
          )}
        </View>
        {unreadCount > 0 && (
          <Text className="text-primary-600 text-sm mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : {}}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;
