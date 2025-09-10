import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchService } from '../../services/searchService';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { formatNumber } from '../../utils/helpers';

const SearchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(true);
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setHasMore(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (isNewSearch = false) => {
    if (searchQuery.trim().length < 2) return;

    const searchPage = isNewSearch ? 1 : page;
    
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await searchService.searchUsers(searchQuery, searchPage);
      
      if (result.success) {
        if (isNewSearch) {
          setSearchResults(result.users);
          setPage(2);
        } else {
          setSearchResults(prev => [...prev, ...result.users]);
          setPage(prev => prev + 1);
        }
        setHasMore(result.hasMore);
      } else {
        console.error('Search failed:', result.error);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      handleSearch(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    handleSearch(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasMore(false);
  };

const navigateToProfile = (user) => {
        // Navigate to UserProfile in the SearchStack
        navigation.navigate('UserProfile', { 
            userId: user._id,
            username: user.username // Optional: for header title
        });
    };

  const renderUser = ({ item }) => (
        <TouchableOpacity
            className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
            onPress={() => navigateToProfile(item)} // Pass the user object
        >
            <Avatar
                uri={item.profilePicture}
                name={item.username}
                size={50}
            />
            
            <View className="flex-1 ml-3">
                <Text className="font-semibold text-gray-900 text-base">
                    {item.username}
                </Text>
                {item.bio && (
                    <Text className="text-gray-600 text-sm mt-1" numberOfLines={1}>
                        {item.bio}
                    </Text>
                )}
                <View className="flex-row items-center mt-1">
                    <Text className="text-gray-500 text-xs">
                        {formatNumber(item.followerCount)} followers
                    </Text>
                    <Text className="text-gray-400 text-xs mx-2">•</Text>
                    <Text className="text-gray-500 text-xs">
                        {formatNumber(item.followingCount)} following
                    </Text>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
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
      return <LoadingSpinner text="Searching users..." />;
    }

    if (searchQuery.length === 0) {
      return (
        <View className="flex-1 items-center justify-center px-8 py-12">
          <Ionicons name="search-outline" size={64} color="#9CA3AF" />
          <Text className="text-xl font-medium text-gray-900 mt-4 mb-2">
            Search Users
          </Text>
          <Text className="text-gray-600 text-center">
            Find people to connect with by searching their username or bio
          </Text>
        </View>
      );
    }

    if (searchQuery.length < 2) {
      return (
        <View className="flex-1 items-center justify-center px-8 py-12">
          <Text className="text-gray-500 text-center">
            Enter at least 2 characters to search
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center px-8 py-12">
        <Ionicons name="person-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-medium text-gray-900 mt-4 mb-2">
          No users found
        </Text>
        <Text className="text-gray-600 text-center">
          Try searching with different keywords
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="p-2 mr-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900 flex-1">
            Search Users
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-900"
            placeholder="Search username or bio..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} className="ml-2">
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={searchResults}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          searchResults.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default SearchScreen;
