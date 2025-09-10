import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { userService } from '../../services/userServices';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { formatNumber } from '../../utils/helpers';

const UserListScreen = ({ route, navigation }) => {
    const { userId, type, title } = route.params; // type: 'followers' or 'following'
    const { user: currentUser } = useAuth();
    const { followUser, unfollowUser } = useUser();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [followingStates, setFollowingStates] = useState({});

    const isOwnProfile = !userId || userId === currentUser?._id;
    const targetUserId = isOwnProfile ? currentUser?._id : userId;

    useEffect(() => {
        loadUsers(true);
    }, [targetUserId, type]);

    const loadUsers = async (isRefresh = false) => {
        if (!targetUserId) return;

        if (isRefresh) {
            setLoading(true);
            setPage(1);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentPage = isRefresh ? 1 : page;

            const result = type === 'followers'
                ? await userService.getFollowers(targetUserId, currentPage)
                : await userService.getFollowing(targetUserId, currentPage);

            if (result.success) {
                const newUsers = result[type] || [];

                if (isRefresh) {
                    setUsers(newUsers);
                    setPage(2);
                } else {
                    setUsers(prev => [...prev, ...newUsers]);
                    setPage(prev => prev + 1);
                }

                setHasMore(result.hasMore || false);

                // ✅ CRITICAL FIX: Handle missing isFollowing field
                const newFollowingStates = {};
                newUsers.forEach(user => {
                    // Handle different scenarios for follow state initialization
                    if (type === 'following' && isOwnProfile) {
                        // If viewing own following list, all should be "Following"
                        newFollowingStates[user._id] = true;
                    } else if (user.hasOwnProperty('isFollowing')) {
                        // If API provides isFollowing, use it
                        newFollowingStates[user._id] = user.isFollowing;
                    } else {
                        // ✅ Fallback: If isFollowing is missing (undefined), default to false
                        newFollowingStates[user._id] = false;
                        console.warn(`Missing isFollowing for user: ${user.username}, defaulting to false`);
                    }

                    console.log(`Frontend: Initializing ${user.username} - isFollowing: ${newFollowingStates[user._id]}`);
                });

                if (isRefresh) {
                    setFollowingStates(newFollowingStates);
                } else {
                    setFollowingStates(prev => ({ ...prev, ...newFollowingStates }));
                }

                console.log('Final following states:', newFollowingStates);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadUsers(true);
    };

    const handleLoadMore = () => {
        if (hasMore && !loading && !loadingMore) {
            loadUsers(false);
        }
    };

    const handleFollowToggle = async (user) => {
        if (user._id === currentUser?._id) return; // Can't follow yourself

        const isCurrentlyFollowing = followingStates[user._id];

        // Optimistic update
        setFollowingStates(prev => ({
            ...prev,
            [user._id]: !isCurrentlyFollowing
        }));

        try {
            const result = isCurrentlyFollowing
                ? await unfollowUser(user._id)
                : await followUser(user._id);

            if (!result.success) {
                // Revert on failure
                setFollowingStates(prev => ({
                    ...prev,
                    [user._id]: isCurrentlyFollowing
                }));
                Alert.alert('Error', result.error || 'Failed to update follow status');
            }
        } catch (error) {
            // Revert on error
            setFollowingStates(prev => ({
                ...prev,
                [user._id]: isCurrentlyFollowing
            }));
            console.error('Follow toggle failed:', error);
            Alert.alert('Error', 'Failed to update follow status');
        }
    };

    const navigateToProfile = (user) => {
        console.log('Navigating to profile:', user.username, user._id);

        if (user._id === currentUser?._id) {
            // ✅ For own profile, navigate to Profile tab
            navigation.navigate('MainTabs', {
                screen: 'Profile'
            });
        } else {
            // ✅ For other users, navigate to UserProfile screen in MainStack
            navigation.navigate('UserProfile', {
                userId: user._id,
                username: user.username
            });
        }
    };

    const renderUser = ({ item: user }) => (
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
            <TouchableOpacity
                className="flex-row items-center flex-1"
                onPress={() => navigateToProfile(user)}
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
                        <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                            {user.bio}
                        </Text>
                    )}
                    <View className="flex-row items-center mt-1">
                        <Text className="text-gray-500 text-xs">
                            {formatNumber(user.followerCount || 0)} followers
                        </Text>
                        {user.followingCount > 0 && (
                            <>
                                <Text className="text-gray-400 text-xs mx-2">•</Text>
                                <Text className="text-gray-500 text-xs">
                                    {formatNumber(user.followingCount)} following
                                </Text>
                            </>
                        )}
                    </View>
                </View>
            </TouchableOpacity>

            {/* Follow/Unfollow Button - Only show for other users */}
            {user._id !== currentUser?._id && (
                <Button
                    title={followingStates[user._id] ? "Following" : "Follow"}
                    variant={followingStates[user._id] ? "outline" : "primary"}
                    size="small"
                    onPress={() => handleFollowToggle(user)}
                    className="ml-3"
                    style={{ minWidth: 80 }}
                />
            )}
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View className="py-4">
                <LoadingSpinner size="small" />
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading) {
            return <LoadingSpinner text={`Loading ${type}...`} />;
        }

        const emptyMessage = type === 'followers'
            ? (isOwnProfile ? "You don't have any followers yet" : "No followers yet")
            : (isOwnProfile ? "You're not following anyone yet" : "Not following anyone yet");

        const emptySubMessage = type === 'followers'
            ? "Share some posts to attract followers"
            : "Discover and follow interesting people";

        return (
            <View className="flex-1 items-center justify-center px-8 py-12">
                <Ionicons
                    name={type === 'followers' ? 'people-outline' : 'person-add-outline'}
                    size={64}
                    color="#9CA3AF"
                />
                <Text className="text-xl font-medium text-gray-900 mt-4 mb-2 text-center">
                    {emptyMessage}
                </Text>
                <Text className="text-gray-600 text-center mb-6">
                    {emptySubMessage}
                </Text>
                {type === 'following' && (
                    <Button
                        title="Discover Users"
                        onPress={() => navigation.navigate('Search')}
                        icon={<Ionicons name="search" size={20} color="white" />}
                    />
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            {/* <View className="bg-white border-b border-gray-200 px-4 py-3">
                <View className="flex-row items-center">
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        className="p-2 mr-2"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    
                    <View className="flex-1">
                        <Text className="text-xl font-semibold text-gray-900">
                            {title || (type === 'followers' ? 'Followers' : 'Following')}
                        </Text>
                        <Text className="text-sm text-gray-500">
                            {formatNumber(users.length)} {type}
                        </Text>
                    </View>

                    <TouchableOpacity className="p-2">
                        <Ionicons name="search-outline" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View> */}

            {/* User List */}
            <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={(item) => item._id}
                contentContainerStyle={
                    users.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
                }
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View className="h-px bg-gray-100 ml-16" />}
            />
        </SafeAreaView>
    );
};

export default UserListScreen;
