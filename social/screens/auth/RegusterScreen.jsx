import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail, validateUsername, validatePassword } from '../../utils/helpers';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters, letters, numbers, and underscores only';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    if (!result.success) {
      setErrors({ general: result.error });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-8">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-primary-600 rounded-full items-center justify-center mb-4">
                <Ionicons name="camera" size={32} color="white" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Join Community
              </Text>
              <Text className="text-gray-600 text-center">
                Create your account to start sharing
              </Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              {errors.general && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <Text className="text-red-700 text-center">
                    {errors.general}
                  </Text>
                </View>
              )}

              <Input
                label="Username"
                placeholder="Choose a unique username"
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                error={errors.username}
                leftIcon={<Ionicons name="person" size={20} color="#6B7280" />}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Email"
                placeholder="Enter your email address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                error={errors.email}
                leftIcon={<Ionicons name="mail" size={20} color="#6B7280" />}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Input
                label="Password"
                placeholder="Create a secure password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed" size={20} color="#6B7280" />}
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed" size={20} color="#6B7280" />}
              />

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                className="mb-4"
              />

              <Text className="text-xs text-gray-500 text-center mb-4">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center mt-auto pb-8">
              <Text className="text-gray-600">
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-primary-600 font-semibold">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
