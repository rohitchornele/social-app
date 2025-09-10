import React, { useEffect, useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePost } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../../components/post/PostCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const FeedScreen = ({ navigation }) => {
  const { user } = useAuth();
  const {
    posts,
    followingPosts,
    loading,
    refreshing,
    hasMore,
    hasMoreFollowing,
    feedType,
    loadPosts,
    refreshPosts,
    loadMorePosts,
    loadFollowingFeed,
    refreshFollowingFeed,
    loadMoreFollowingFeed,
    switchFeedType,
  } = usePost();

  const [showFeedSelector, setShowFeedSelector] = useState(false);

useEffect(() => {
  console.log('🎯 FeedScreen - Feed type changed to:', feedType);
  
  if (feedType === 'all') {
    console.log('📖 Loading all posts');
    loadPosts();
  } else if (feedType === 'following') {
    console.log('👥 Loading following posts');
    loadFollowingFeed(true); // Force refresh when switching
  }
}, [feedType]);

  // Remove duplicates and validate posts
  const getValidPosts = (posts) => {
    const seenIds = new Set();
    const validPosts = [];
    
    posts.forEach((post, index) => {
      // Skip invalid posts
      if (!post || !post._id || !post.imageUrl) {
        console.warn(`Invalid post at index ${index}:`, post);
        return;
      }
      
      // Skip duplicates
      if (seenIds.has(post._id)) {
        console.warn(`Duplicate post ID found: ${post._id}`);
        return;
      }
      
      seenIds.add(post._id);
      validPosts.push(post);
    });
    
    return validPosts;
  };

  const rawCurrentPosts = feedType === 'all' ? posts : followingPosts;
  const currentPosts = getValidPosts(rawCurrentPosts);
  const currentHasMore = feedType === 'all' ? hasMore : hasMoreFollowing;

  // Debug function (remove in production)
  useEffect(() => {
    console.log('Feed Debug:', {
      feedType,
      rawPostsLength: rawCurrentPosts.length,  
      validPostsLength: currentPosts.length,
      duplicatesRemoved: rawCurrentPosts.length - currentPosts.length
    });
  }, [currentPosts, feedType]);

  const handleRefresh = useCallback(() => {
    if (feedType === 'all') {
      refreshPosts();
    } else {
      refreshFollowingFeed();
    }
  }, [feedType, refreshPosts, refreshFollowingFeed]);

  const handleLoadMore = useCallback(() => {
    if (!loading && currentHasMore) {
      if (feedType === 'all') {
        loadMorePosts();
      } else {
        loadMoreFollowingFeed();
      }
    }
  }, [loading, currentHasMore, feedType, loadMorePosts, loadMoreFollowingFeed]);

 const renderPost = ({ item, index }) => {
  if (!item || !item._id) {
    console.warn(`Invalid item at index ${index}`);
    return null;
  }



  return (
    <PostCard
      key={item._id}
      post={item}
      onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
      onUserPress={() => {
        console.log('User pressed:', item.user._id, item.user.username);
        
        // ✅ CORRECT: Navigate to other user's profile with userId
        if (item.user._id === user?._id) {
          // If it's your own post, navigate to your profile tab
          navigation.navigate('MainTabs', { screen: 'Profile' });
        } else {
          // If it's someone else's post, navigate to their profile screen
          navigation.navigate('UserProfile', { 
            userId: item.user._id,
            username: item.user.username // Optional: for header title
          });
          console.log("this is some else account");
        }
      }}
    />
  );
};

  const renderFooter = () => {
    if (!loading || currentPosts.length === 0) return null;
    return (
      <View className="py-4">
        <LoadingSpinner size="small" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && currentPosts.length === 0) {
      return <LoadingSpinner text="Loading posts..." />;
    }

  console.log('=== FEED DEBUG ===');
  console.log('Feed Type:', feedType);
  console.log('All Posts Length:', posts.length);
  console.log('Following Posts Length:', followingPosts.length);
  console.log('Current User Following:', user?.following?.length || 0);
  console.log('Loading:', loading);
  console.log('==================');

    return (
      <View className="flex-1 items-center justify-center px-8 py-12">
        <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-medium text-gray-900 mt-4 mb-2 text-center">
          {feedType === 'all' ? 'No posts yet' : 'No posts from following'}
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          {feedType === 'all' 
            ? 'Be the first to share a moment with the community'
            : 'Follow some users to see their posts here'
          }
        </Text>
        <Button
          title={feedType === 'all' ? "Create Your First Post" : "Discover Users"}
          onPress={() => {
            if (feedType === 'all') {
              navigation.navigate('CreatePost');
            } else {
              navigation.navigate('Search');
            }
          }}
          icon={<Ionicons name="add" size={20} color="white" />}
        />
      </View>
    );
  };

  const FeedSelector = () => (
    <View 
      className="bg-white border border-gray-200 rounded-lg shadow-lg z-10"
      style={{
        position: 'absolute',
        top: 70,
        right: 10,
        paddingHorizontal: 20
      }}
    >
      <TouchableOpacity
        className={`px-4 py-3 border-b border-gray-100 ${feedType === 'all' ? 'bg-primary-50' : ''}`}
        onPress={() => {
          switchFeedType('all');
          setShowFeedSelector(false);
        }}
      >
        <Text className={`font-medium ${feedType === 'all' ? 'text-primary-600' : 'text-gray-900'}`}>
          All Posts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`px-4 py-3 ${feedType === 'following' ? 'bg-primary-50' : ''}`}
        onPress={() => {
          switchFeedType('following');
          setShowFeedSelector(false);
        }}
      >
        <Text className={`font-medium ${feedType === 'following' ? 'text-primary-600' : 'text-gray-900'}`}>
          Following
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">
            Community
          </Text>
          <View className="flex-row space-x-4">
            <Button
              onPress={() => setShowFeedSelector(!showFeedSelector)}
              variant="ghost"
              size="small"
              icon={<Ionicons name="filter" size={24} color="#3B82F6" />}
            />
            <Button
              onPress={() => navigation.navigate('CreatePost')}
              variant="ghost"
              size="small"
              icon={<Ionicons name="add" size={24} color="#3B82F6" />}
            />
            <Button
              onPress={() => navigation.navigate('Notifications')}
              variant="ghost"
              size="small"
              icon={<Ionicons name="notifications-outline" size={24} color="#3B82F6" />}
            />
          </View>
        </View>
        
        {/* Feed Type Indicator */}
        <View className="flex-row items-center mt-2">
          <Text className="text-sm text-gray-500">
            Showing: {feedType === 'all' ? 'All Posts' : 'Posts from Following'}
          </Text>
        </View>
      </View>

      {showFeedSelector && <FeedSelector />}

      {/* Feed - Updated FlatList */}
      <FlatList
        data={currentPosts}
        extraData={currentPosts} // Important: forces re-render when data changes
        renderItem={renderPost}
        keyExtractor={(item, index) => {
          // Safe key extraction with fallback
          if (!item || !item._id) {
            console.warn(`Missing ID for item at index ${index}`);
            return `fallback-${index}-${Date.now()}`;
          }
          return item._id.toString();
        }}
        contentContainerStyle={currentPosts.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

export default FeedScreen;
