import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import WineDetailScreen from '../screens/WineDetailScreen';
import MyWineDetailScreen from '../screens/MyWineDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationScreen from '../screens/NotificationScreen';
import WineAddScreen from '../screens/WineAddScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import SettingScreen from '../screens/SettingScreen';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

// 모든 스크린을 등록하고 navigation.navigate로 이동하는 방식으로 변경
export default function RootNavigator() {
  const { isLoggedIn, isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName={isLoggedIn ? "Main" : "Login"}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="WineDetail" component={WineDetailScreen} />
      <Stack.Screen name="MyWineDetail" component={MyWineDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="WineAdd" component={WineAddScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Setting" component={SettingScreen} />
    </Stack.Navigator>
  );
}
