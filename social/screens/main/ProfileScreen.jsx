import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from "react-native";
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { userService } from '../../services/userServices';
import { formatNumber } from '../../utils/helpers';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ route, navigation }) => {
    const { userId } = route?.params || {};
    const { user: currentUser, logout, updateProfile } = useAuth();
    const {
        currentProfile,
        userPosts,
        loading,
        getUserProfile,
        getUserPosts,
        followUser,
        unfollowUser,
        uploadProfilePicture,
        clearProfile
    } = useUser();

    // Determine if viewing own profile
    const isOwnProfile = !userId || userId === currentUser?._id;
    const profileUserId = isOwnProfile ? currentUser?._id : userId;

    // Use current user data for own profile, context data for others
    const displayUser = isOwnProfile ? currentUser : currentProfile;

    const [refreshing, setRefreshing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({
        username: '',
        bio: '',
    });
    const [postsPage, setPostsPage] = useState(1);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (isOwnProfile) {
            setEditData({
                username: currentUser?.username || '',
                bio: currentUser?.bio || '',
            });
        } else {
            // Clear previous profile data when viewing different user
            clearProfile();
        }

        loadProfile();
        loadPosts();
    }, [profileUserId, currentUser]);

    const loadProfile = async () => {
        if (!isOwnProfile) {
            await getUserProfile(profileUserId);
        }
    };

    const loadPosts = async () => {
        if (!profileUserId) {
            console.error('No profileUserId available');
            return;
        }
        const result = await getUserPosts(profileUserId, 1, true);
        if (result.success) {
            setPostsPage(1);
            setHasMorePosts(result.hasMore);
            console.log('Posts loaded successfully, count:', result.posts?.length);
        } else {
            console.error('Failed to load posts:', result.error);
        }
    };

    const loadMorePosts = async () => {
        if (!hasMorePosts || loadingMorePosts) return;

        setLoadingMorePosts(true);
        const result = await getUserPosts(profileUserId, postsPage + 1, false);

        if (result.success) {
            setPostsPage(prev => prev + 1);
            setHasMorePosts(result.hasMore);
        }

        setLoadingMorePosts(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            loadProfile(),
            loadPosts(),
        ]);
        setRefreshing(false);
    };

    const handleEditProfile = () => {
        setEditMode(true);
    };

    const handleSaveProfile = async () => {
        try {
            const result = await updateProfile(editData);
            if (result.success) {
                setEditMode(false);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditData({
            username: currentUser?.username || '',
            bio: currentUser?.bio || '',
        });
    };

    const handleFollow = async () => {
        setFollowLoading(true);

        try {
            let result;
            if (displayUser?.isFollowing) {
                result = await unfollowUser(profileUserId);
            } else {
                result = await followUser(profileUserId);
            }

            if (result.success) {
                // Reload profile to get updated follower count
                await getUserProfile(profileUserId);
            }
        } catch (error) {
            console.error('Follow/unfollow failed:', error);
        }

        setFollowLoading(false);
    };
    const handleProfilePictureChange = async () => {
        if (!isOwnProfile) return;

        Alert.alert(
            'Change Profile Picture',
            'Choose an option',
            [
                { text: 'Camera', onPress: () => pickImage('camera') },
                { text: 'Photo Library', onPress: () => pickImage('library') },
                { text: 'Remove Photo', onPress: () => removeProfilePicture(), style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const pickImage = async (source) => {
        try {
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Camera permissions are needed.');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Camera roll permissions are needed.');
                    return;
                }
            }

            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                });

            if (!result.canceled) {
                await uploadProfilePicture(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile picture');
        }
    };

    const removeProfilePicture = async () => {
        // TODO: Implement remove profile picture API
        Alert.alert('Feature Coming Soon', 'Profile picture removal will be available soon');
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]
        );
    };

    const handleFollowersPress = () => {
        navigation.navigate('UserList', { 
            userId: profileUserId, 
            type: 'followers',
            title: `${displayUser?.username || 'User'}'s Followers`
        });
    };

    const handleFollowingPress = () => {
        navigation.navigate('UserList', { 
            userId: profileUserId, 
            type: 'following',
            title: `${displayUser?.username || 'User'}'s Following`
        });
    };


    const handlePostPress = (post, index) => {
        navigation.navigate('PostDetail', {
            postId: post._id,
            // Pass additional context for better navigation
            fromProfile: true,
            userId: profileUserId
        });
    };

    const renderPost = ({ item, index }) => (
        <TouchableOpacity
            style={{
                flex: 1,
                aspectRatio: 1,
                maxWidth: '33%',
            }}
            onPress={() => handlePostPress(item, index)}
        >
            <Image
                source={{ uri: item.imageUrl }}
                style={{
                    width: '100%',
                    height: '100%'
                }}
                resizeMode="cover"
            />

            {/* Post Stats Overlay */}
            <View className="absolute inset-0 bg-black/0 active:bg-black/20">
                {/* Show stats on press - you can enhance this */}
            </View>

            {/* Multiple images indicator */}
            {item.isMultiple && (
                <View className="absolute top-2 right-2 bg-black/50 rounded p-1">
                    <Ionicons name="copy" size={12} color="white" />
                </View>
            )}
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loadingMorePosts) return null;

        return (
            <View className="py-4">
                <LoadingSpinner size="small" />
            </View>
        );
    };

    const renderHeader = () => (
        <View>
            {/* Profile Info */}
            <View style={{
                marginTop: 5,
                // paddingHorizontal: 10,
                paddingVertical: 5,
            }}>
                <View className="flex-row items-center justify-between mb-6" >
                    {/* Profile Picture */}
                    <TouchableOpacity
                        onPress={isOwnProfile ? handleProfilePictureChange : undefined}
                        className="relative"
                        disabled={loading}
                    >
                        <Avatar
                            uri={displayUser?.profilePicture}
                            name={displayUser?.username}
                            size={80}
                        />
                        {isOwnProfile && (
                            <View className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2">
                                <Ionicons name="camera" size={16} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Stats */}
                    <View
                        className="flex-1 flex-row justify-around ml-8"
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginTop: 5,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            justifyContent: 'space-around'
                        }}
                    >
                        <TouchableOpacity className="items-center">
                            <Text className="text-xl font-bold text-gray-900">
                                {formatNumber(userPosts.length)}
                            </Text>
                            <Text className="text-gray-600 text-sm">Posts</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="items-center"
                            onPress={handleFollowersPress}
                        >
                            <Text className="text-xl font-bold text-gray-900">
                                {formatNumber(displayUser?.followers?.length || 0)}
                            </Text>
                            <Text className="text-gray-600 text-sm">Followers</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="items-center"
                            onPress={handleFollowingPress}
                        >
                            <Text className="text-xl font-bold text-gray-900">
                                {formatNumber(displayUser?.following?.length || 0)}
                            </Text>
                            <Text className="text-gray-600 text-sm">Following</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* User Info */}
                {editMode ? (
                    <View>
                        <Input
                            label="Username"
                            value={editData.username}
                            onChangeText={(text) => setEditData(prev => ({ ...prev, username: text }))}
                            placeholder="Enter username"
                            className="mb-4"
                        />

                        <Input
                            label="Bio"
                            value={editData.bio}
                            onChangeText={(text) => setEditData(prev => ({ ...prev, bio: text }))}
                            placeholder="Write a bio..."
                            multiline
                            numberOfLines={3}
                            className="mb-4"
                        />

                        <View className="flex-row space-x-3">
                            <Button
                                title="Save"
                                onPress={handleSaveProfile}
                                className="flex-1"
                                loading={loading}
                            />
                            <Button
                                title="Cancel"
                                variant="secondary"
                                onPress={handleCancelEdit}
                                className="flex-1"
                            />
                        </View>
                    </View>
                ) : (
                    <View>
                        <Text
                            // className="text-lg font-semibold text-gray-900"
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                // paddingHorizontal: 5,
                                justifyContent: 'space-around',
                                fontWeight: 'bold',
                                fontSize: 17,
                                marginBottom: 10
                            }}
                        >
                            {displayUser?.username}
                        </Text>

                        {displayUser?.bio && (
                            <Text className="text-gray-700 text-sm leading-5 mb-4"
                            // style={{ paddingHorizontal: 5 }}
                            >
                                <Text>{displayUser?.bio}</Text>
                            </Text>
                        )}

                        {/* Action Buttons */}
                        {isOwnProfile ? (
                            <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                                <Button
                                    title="Edit Profile"
                                    variant="outline"
                                    onPress={handleEditProfile}
                                    className="flex-1"
                                />
                                <Button
                                    title="Share Profile"
                                    variant="outline"
                                    onPress={() => {/* TODO: Implement share */ }}
                                    className="flex-1"
                                    icon={<Ionicons name="share-outline" size={18} color="#3B82F6" />}
                                />
                            </View>
                        ) : (
                            <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                                <Button
                                    title={displayUser?.isFollowing ? "Following" : "Follow"}
                                    variant={displayUser?.isFollowing ? "outline" : "primary"}
                                    onPress={handleFollow}
                                    loading={followLoading}
                                    className="flex-1"
                                    icon={displayUser?.isFollowing ?
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
                        )}
                    </View>
                )}
            </View>

            {/* Posts Header */}
            <View className="border-t border-gray-200 py-3 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-gray-900">
                    Posts
                </Text>
                <Text className="text-gray-500 text-sm">
                    {formatNumber(userPosts.length)} post{userPosts.length !== 1 ? 's' : ''}
                </Text>
            </View>
        </View>
    );

    const renderEmpty = () => {
        if (loading) {
            return <LoadingSpinner text="Loading posts..." />;
        }

        return (
            <View className="items-center justify-center py-12">
                <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
                <Text className="text-xl font-medium text-gray-900 mt-4 mb-2">
                    {isOwnProfile ? 'No posts yet' : 'No posts'}
                </Text>
                <Text className="text-gray-600 text-center mb-6">
                    {isOwnProfile
                        ? 'Share your first moment with the community'
                        : `${displayUser?.username || 'This user'} hasn't shared any posts yet`
                    }
                </Text>
                {isOwnProfile && (
                    <Button
                        title="Create Post"
                        onPress={() => navigation.navigate('CreatePost')}
                        icon={<Ionicons name="add" size={20} color="white" />}
                    />
                )}
            </View>
        );
    };

    if (loading && !displayUser) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <LoadingSpinner text="Loading profile..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white"
            style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
            }}>
            {/* Header */}
            <View
                className="flex-row items-center justify-between py-3 border-b border-gray-200"
            >
                {!isOwnProfile && (
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-1"
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                )}

                <Text className="text-xl font-semibold text-gray-900 flex-1 text-start">
                    {displayUser?.username || 'Profile'}
                </Text>

                <View className="flex-row space-x-2">
                    {isOwnProfile ? (
                        <>
                            <TouchableOpacity
                                className="p-2"
                                onPress={() => navigation.navigate('CreatePost')}
                            >
                                <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="p-2"
                                onPress={handleLogout}
                            >
                                <Ionicons name="log-out-outline" size={24} color="#3B82F6" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity className="p-2">
                            <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={userPosts}
                renderItem={renderPost}
                keyExtractor={(item) => item._id}
                numColumns={3}
                justifyContent={'space-between'}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                        tintColor="#3B82F6"
                    />
                }
                onEndReached={loadMorePosts}
                onEndReachedThreshold={0.1}
                contentContainerStyle={userPosts.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

export default ProfileScreen;
