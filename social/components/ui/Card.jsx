import React from 'react';
import { View } from 'react-native';

const Card = ({
  children,
  className = '',
  shadow = true,
  padding = true,
  ...props
}) => {
  return (
    <View
      className={`
        bg-white rounded-lg
        ${shadow ? 'shadow-sm' : ''}
        ${padding ? 'p-4' : ''}
        ${className}
      `}
      style={shadow ? {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      } : {}}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
