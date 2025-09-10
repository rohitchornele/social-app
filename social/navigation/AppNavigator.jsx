import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegusterScreen';
import SearchStackNavigator from './SearchStackNavigator';


// Main Screens
import FeedScreen from '../screens/main/FeedScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PostDetailScreen from '../screens/main/PostDetailScreen';
import SearchScreen from '../screens/main/SearchScreen'; 


// Loading
import LoadingSpinner from '../components/common/LoadingSpinner';
import UserListScreen from '../screens/main/UserListScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Feed') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Search') {
          iconName = focused ? 'search' : 'search-outline';
        } else if (route.name === 'CreatePost') {
          iconName = focused ? 'add-circle' : 'add-circle-outline';
        } else if (route.name === 'Notifications') {
          iconName = focused ? 'notifications' : 'notifications-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: '#6B7280',
      tabBarShowLabel: true,
      tabBarStyle: {
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
    })}
  >
    <Tab.Screen name="Feed" component={FeedScreen} />
    <Tab.Screen 
      name="Search" 
      component={SearchStackNavigator} // Use the Stack Navigator here
      options={{ tabBarLabel: 'Search' }}
    />
    <Tab.Screen 
      name="CreatePost" 
      component={CreatePostScreen}
      options={{ tabBarLabel: 'Create' }}
    />
    <Tab.Screen name="Notifications" component={NotificationsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const MainStack = () => (
   <Stack.Navigator>
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ headerShown: false }}
    />
    
    {/* ✅ UserProfile should be at MainStack level */}
    <Stack.Screen 
      name="UserProfile" 
      component={UserProfileScreen}
      options={({ route }) => ({
        title: route.params?.username || 'Profile',
        headerBackTitleVisible: false,
        headerTintColor: '#3B82F6',
        headerShown: true, // ✅ Ensure header is shown
      })}
    />
    
    {/* ✅ UserList should also be at MainStack level */}
    <Stack.Screen 
      name="UserList" 
      component={UserListScreen}
      options={({ route }) => ({
        title: route.params?.title || 'Users',
        headerBackTitleVisible: false,
        headerTintColor: '#3B82F6',
        headerShown: true, // ✅ Ensure header is shown
      })}
    />
    
    <Stack.Screen 
      name="PostDetail" 
      component={PostDetailScreen}
      options={{
        title: 'Post',
        headerBackTitleVisible: false,
        headerTintColor: '#3B82F6',
      }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner text="Loading..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
