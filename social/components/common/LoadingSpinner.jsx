import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

const LoadingSpinner = ({
  size = 'large',
  color = '#3B82F6',
  text = '',
  className = '',
}) => {
  return (
    <View className={`flex-1 items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-600 mt-4 text-center">
          {text}
        </Text>
      )}
    </View>
  );
};

export default LoadingSpinner;
