import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const { login, isLoading } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email or username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const result = await login(formData);
    if (!result.success) {
      setErrors({ general: result.error });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-red-500">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-12">
            {/* Header */}
            <View className="items-center mb-12">
              <View className="w-20 h-20 bg-primary-600 rounded-full items-center justify-center mb-4">
                <Ionicons name="camera" size={32} color="white" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </Text>
              <Text className="text-gray-600 text-center">
                Sign in to continue sharing moments
              </Text>
            </View>

            {/* Form */}
            <View className="mb-8">
              {errors.general && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <Text className="text-red-700 text-center">
                    {errors.general}
                  </Text>
                </View>
              )}

              <Input
                label="Email or Username"
                placeholder="Enter your email or username"
                value={formData.emailOrUsername}
                onChangeText={(value) => handleInputChange('emailOrUsername', value)}
                error={errors.emailOrUsername}
                leftIcon={<Ionicons name="person" size={20} color="#6B7280" />}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed" size={20} color="#6B7280" />}
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
                className="mb-4"
              />

              <TouchableOpacity className="items-center py-2">
                <Text className="text-primary-600 font-medium">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center mt-auto pb-8">
              <Text className="text-gray-600">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="text-primary-600 font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
