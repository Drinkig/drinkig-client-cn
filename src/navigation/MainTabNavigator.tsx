import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MyWineScreen from '../screens/MyWineScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../constants/colors';
import { CustomTabBar } from '../components/navigation/CustomTabBar';

const Tab = createBottomTabNavigator();

import { useTranslation } from 'react-i18next';

export default function MainTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tab.home', '홈'), // Used for accessibility in CustomTabBar
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: t('tab.search', '검색'),
        }}
      />
      <Tab.Screen
        name="MyWine"
        component={MyWineScreen}
        options={{
          tabBarLabel: t('tab.myWine', '내 와인'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tab.profile', '마이페이지'),
        }}
      />
    </Tab.Navigator>
  );
}

