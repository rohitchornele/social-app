import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="warning-outline" size={64} color="#EF4444" />
            <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2 text-center">
              Something went wrong
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              We're sorry for the inconvenience. Please try restarting the app.
            </Text>
            <Button
              title="Try Again"
              onPress={() => this.setState({ hasError: false, error: null })}
            />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
