import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from "react-native";
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { formatNumber } from '../../utils/helpers';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

const UserProfileScreen = ({ route, navigation }) => {
    const { userId, username } = route.params;
    const { user: currentUser } = useAuth();
    const {
        currentProfile,
        userPosts,
        loading,
        getUserProfile,
        getUserPosts,
        followUser,
        unfollowUser,
        clearProfile
    } = useUser();

    const [refreshing, setRefreshing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    console.log('UserProfileScreen - userId:', userId, 'username:', username);

    useEffect(() => {
        if (userId && userId !== currentUser?._id) {
            loadUserData();
        }
        
        return () => {
            clearProfile();
        };
    }, [userId]);

    // ✅ Add validation function (same as ProfileScreen fix)
    const getValidPosts = (posts) => {
        const seenIds = new Set();
        const validPosts = [];
        
        posts.forEach((post, index) => {
            if (!post || !post._id || !post.imageUrl) {
                console.warn(`Invalid post at index ${index}:`, post);
                return;
            }
            
            if (seenIds.has(post._id)) {
                console.warn(`Duplicate post ID found: ${post._id}`);
                return;
            }
            
            seenIds.add(post._id);
            validPosts.push(post);
        });
        
        return validPosts;
    };

    const validUserPosts = getValidPosts(userPosts);

    // ✅ Add debug logging
    useEffect(() => {
        console.log('UserProfile Posts Debug:', {
            rawPostsLength: userPosts.length,
            validPostsLength: validUserPosts.length,
            duplicatesRemoved: userPosts.length - validUserPosts.length
        });
    }, [userPosts]);

    const loadUserData = async () => {
        await Promise.all([
            getUserProfile(userId),
            getUserPosts(userId, 1, true)
        ]);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadUserData();
        setRefreshing(false);
    };

    const handleFollow = async () => {
        if (!currentProfile) return;
        
        setFollowLoading(true);
        
        try {
            if (currentProfile.isFollowing) {
                await unfollowUser(userId);
            } else {
                await followUser(userId);
            }
            
            await getUserProfile(userId);
        } catch (error) {
            console.error('Follow/unfollow failed:', error);
        }
        
        setFollowLoading(false);
    };

    const handleFollowersPress = () => {
        navigation.navigate('UserList', {
            userId: userId,
            type: 'followers',
            title: `${currentProfile?.username}'s Followers`
        });
    };

    const handleFollowingPress = () => {
        navigation.navigate('UserList', {
            userId: userId,
            type: 'following',
            title: `${currentProfile?.username}'s Following`
        });
    };

    const handlePostPress = (post) => {
        navigation.navigate('PostDetail', {
            postId: post._id,
            fromProfile: true
        });
    };

    const renderPost = ({ item, index }) => {
        console.log('Rendering post:', index, item._id, item.imageUrl);
        
        // ✅ Enhanced safety check
        if (!item || !item._id) {
            console.warn(`Invalid item at index ${index}`);
            return null;
        }

        if (!item.imageUrl) {
            console.warn('Missing imageUrl for post:', item._id);
            return (
                <View style={{
                    flex: 1,
                    aspectRatio: 1,
                    margin: 2,
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Text style={{ color: '#666' }}>No Image</Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={{
                    flex: 1,
                    aspectRatio: 1,
                    margin: 2,
                    maxWidth: '33%' // ✅ Ensure proper width for 3 columns
                }}
                onPress={() => handlePostPress(item)}
            >
                <Image
                    source={{ uri: item.imageUrl }}
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                    resizeMode="cover"
                    onError={(error) => console.log('Image load error:', error)}
                    onLoad={() => console.log('Image loaded:', item._id)}
                />
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View className="items-center justify-center py-12">
            <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-medium text-gray-900 mt-4 mb-2">
                No posts yet
            </Text>
            <Text className="text-gray-600 text-center">
                {currentProfile?.username} hasn't shared any posts yet
            </Text>
        </View>
    );

    if (loading && !currentProfile) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <LoadingSpinner text="Loading profile..." />
            </SafeAreaView>
        );
    }

    if (!currentProfile) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-500">User not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View className="px-4 py-6">
                    <View className="flex-row items-center justify-between mb-6">
                        <Avatar
                            uri={currentProfile.profilePicture}
                            name={currentProfile.username}
                            size={80}
                        />
                        
                        <View style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flex: 1,
                            justifyContent: 'space-around',
                            marginLeft: 32
                        }}>
                            <View className="items-center">
                                <Text className="text-xl font-bold text-gray-900">
                                    {formatNumber(validUserPosts.length)} {/* ✅ Use validPosts count */}
                                </Text>
                                <Text className="text-gray-600 text-sm">Posts</Text>
                            </View>

                            <TouchableOpacity
                                className="items-center"
                                onPress={handleFollowersPress}
                            >
                                <Text className="text-xl font-bold text-gray-900">
                                    {formatNumber(currentProfile.followerCount || 0)}
                                </Text>
                                <Text className="text-gray-600 text-sm">Followers</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="items-center"
                                onPress={handleFollowingPress}
                            >
                                <Text className="text-xl font-bold text-gray-900">
                                    {formatNumber(currentProfile.followingCount || 0)}
                                </Text>
                                <Text className="text-gray-600 text-sm">Following</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* User Info */}
                    <View className="mb-6 px-2">
                        <Text className="text-lg font-semibold text-gray-900 mb-1">
                            {currentProfile.username}
                        </Text>
                        
                        {currentProfile.bio && (
                            <Text className="text-gray-700 text-sm leading-5 mb-4">
                                {currentProfile.bio}
                            </Text>
                        )}

                        {/* Action Buttons */}
                        <View style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginTop: 16,
                            gap: 12
                        }}>
                            <Button
                                title={currentProfile.isFollowing ? "Following" : "Follow"}
                                variant={currentProfile.isFollowing ? "outline" : "primary"}
                                onPress={handleFollow}
                                loading={followLoading}
                                className="flex-1"
                                icon={currentProfile.isFollowing ?
                                    <Ionicons name="checkmark" size={18} color="#3B82F6" /> :
                                    <Ionicons name="person-add" size={18} color="white" />
                                }
                            />
                            <Button
                                title="Message"
                                variant="outline"
                                className="flex-1"
                                icon={<Ionicons name="chatbubble-outline" size={18} color="#3B82F6" />}
                                onPress={() => {
                                    Alert.alert('Coming Soon', 'Messaging feature will be available soon');
                                }}
                            />
                        </View>
                    </View>
                </View>

                {/* Posts Section - ✅ FIXED */}
                <View className="border-t border-gray-200">
                    <View className="px-4 py-3 border-b border-gray-200">
                        <Text className="text-lg font-semibold text-gray-900">
                            Posts ({formatNumber(validUserPosts.length)}) {/* ✅ Use validPosts count */}
                        </Text>
                    </View>

                    {/* ✅ Container with proper dimensions */}
                    <View style={{ minHeight: 200 }}>
                        {validUserPosts.length > 0 ? (
                            <FlatList
                                data={validUserPosts} // ✅ Use validated posts
                                extraData={validUserPosts} // ✅ Critical for re-renders
                                renderItem={renderPost}
                                keyExtractor={(item, index) => {
                                    if (!item || !item._id) {
                                        console.warn(`Missing ID for item at index ${index}`);
                                        return `fallback-${index}-${Date.now()}`;
                                    }
                                    return item._id.toString();
                                }}
                                numColumns={3}
                                scrollEnabled={false} // ✅ Since it's inside ScrollView
                                contentContainerStyle={
                                    validUserPosts.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
                                }
                                ListEmptyComponent={renderEmpty}
                                // ✅ Performance optimizations
                                removeClippedSubviews={false} // Better for small lists
                                initialNumToRender={validUserPosts.length}
                                maxToRenderPerBatch={15}
                                windowSize={10}
                            />
                        ) : (
                            renderEmpty()
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default UserProfileScreen;
