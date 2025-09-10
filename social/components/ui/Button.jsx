import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon = null,
  className = '',
  textClassName = '',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-600 active:bg-primary-700';
      case 'secondary':
        return 'bg-gray-200 active:bg-gray-300';
      case 'outline':
        return 'border border-primary-600 bg-transparent active:bg-primary-50';
      case 'ghost':
        return 'bg-transparent active:bg-gray-100';
      case 'danger':
        return 'bg-red-600 active:bg-red-700';
      default:
        return 'bg-primary-600 active:bg-primary-700';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2';
      case 'medium':
        return 'px-4 py-3';
      case 'large':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  const getTextStyles = () => {
    const baseStyles = 'font-semibold text-center';
    
    switch (variant) {
      case 'primary':
      case 'danger':
        return `${baseStyles} text-white`;
      case 'secondary':
        return `${baseStyles} text-gray-700`;
      case 'outline':
        return `${baseStyles} text-primary-600`;
      case 'ghost':
        return `${baseStyles} text-gray-700`;
      default:
        return `${baseStyles} text-white`;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        rounded-lg
        flex-row items-center justify-center
        ${isDisabled ? 'opacity-50' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#2563eb' : 'white'}
          style={{ marginRight: title ? 8 : 0 }}
        />
      )}
      
      {icon && !loading && (
        <View style={{ marginRight: title ? 8 : 0 }}>
          {icon}
        </View>
      )}
      
      {title && (
        <Text className={`${getTextStyles()} ${getTextSize()} ${textClassName}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
