import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { usePost } from '../../contexts/PostContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const CreatePostScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [caption, setCaption] = useState('');
  const { createPost, loading } = usePost();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload photos.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCreatePost = async () => {
    if (!imageUri) {
      Alert.alert('Image Required', 'Please select an image to share');
      return;
    }

    const result = await createPost({
      imageUri,
      caption: caption.trim(),
    });

    if (result.success) {
      navigation.goBack();
    }
  };

  const resetForm = () => {
    setImageUri(null);
    setCaption('');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          New Post
        </Text>
        <Button
          title="Share"
          onPress={handleCreatePost}
          loading={loading}
          disabled={!imageUri}
          size="small"
        />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Image Selection */}
        <View className="mb-6">
          <Text className="text-gray-700 text-sm font-medium mb-3">
            Photo
          </Text>
          
          {imageUri ? (
            <View className="relative">
              <Image
                source={{ uri: imageUri }}
                className="w-full aspect-square rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                onPress={resetForm}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                className="absolute bottom-2 right-2 bg-black/50 rounded-full p-2"
                onPress={showImagePicker}
              >
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center"
              onPress={showImagePicker}
            >
              <Ionicons name="camera" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 font-medium">
                Tap to add photo
              </Text>
              <Text className="text-gray-400 text-sm">
                Choose from library or take a photo
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Caption */}
        <Input
          label="Caption"
          placeholder="Write a caption..."
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
          className="mb-6"
        />

        {/* Tips */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Text className="text-blue-800 font-medium mb-2">
            📸 Tips for great posts
          </Text>
          <Text className="text-blue-700 text-sm leading-5">
            • Use good lighting for clear photos{'\n'}
            • Write engaging captions{'\n'}
            • Share moments that matter to you{'\n'}
            • Be respectful to the community
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;
