import React from 'react';
import { View, Text, Image } from 'react-native';

const Avatar = ({
  uri,
  name,
  size = 40,
  className = '',
  textClassName = '',
}) => {
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const names = fullName.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : fullName[0].toUpperCase();
  };

  const getFontSize = () => {
    if (size <= 24) return 'text-xs';
    if (size <= 32) return 'text-sm';
    if (size <= 48) return 'text-base';
    return 'text-lg';
  };

  return (
    <View 
      className={`
        rounded-full overflow-hidden bg-gray-200
        items-center justify-center
        ${className}
      `}
      style={{ width: size, height: size }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          className="rounded-full"
        />
      ) : (
        <Text 
          className={`
            font-semibold text-gray-600
            ${getFontSize()}
            ${textClassName}
          `}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

export default Avatar;
