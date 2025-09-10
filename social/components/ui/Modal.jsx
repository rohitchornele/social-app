import React from 'react';
import { View, Modal as RNModal, TouchableOpacity, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const Modal = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  animationType = 'slide',
  className = '',
}) => {
  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <View className="w-6" />
          
          {title && (
            <Text className="text-lg font-semibold text-gray-900">
              {title}
            </Text>
          )}
          
          {showCloseButton && (
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView className={`flex-1 ${className}`}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </RNModal>
  );
};

export default Modal;
