import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from '../screens/main/SearchScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen'; // Create this

const SearchStack = createNativeStackNavigator();

const SearchStackNavigator = () => {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen 
        name="SearchMain" 
        component={SearchScreen}
        options={{ 
          headerShown: false // Hide header on search screen since it has its own
        }}
      />
      <SearchStack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={({ route }) => ({
          title: route.params?.username || 'User Profile',
          headerBackTitleVisible: false,
          headerTintColor: '#3B82F6',
        })}
      />
    </SearchStack.Navigator>
  );
};

export default SearchStackNavigator;
