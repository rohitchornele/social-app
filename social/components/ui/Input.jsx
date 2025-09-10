import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-gray-700 text-sm font-medium mb-2">
          {label}
        </Text>
      )}
      
      <View className={`
        relative
        border rounded-lg
        ${error ? 'border-red-500' : isFocused ? 'border-primary-600' : 'border-gray-300'}
        ${multiline ? 'py-3' : 'py-0'}
      `}>
        {leftIcon && (
          <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            {leftIcon}
          </View>
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={isSecure}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            px-4 
            ${multiline ? 'py-0' : 'py-4'}
            text-base text-gray-900
            ${leftIcon ? 'pl-12' : ''}
            ${rightIcon || secureTextEntry ? 'pr-12' : ''}
            ${inputClassName}
          `}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            onPress={secureTextEntry ? toggleSecureEntry : onRightIconPress}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {secureTextEntry ? (
              <Ionicons
                name={isSecure ? 'eye-off' : 'eye'}
                size={20}
                color="#6B7280"
              />
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text className="text-red-500 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
