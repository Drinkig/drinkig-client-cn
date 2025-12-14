import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import WineDetailScreen from '../screens/WineDetailScreen';
import MyWineDetailScreen from '../screens/MyWineDetailScreen';
import NotificationScreen from '../screens/NotificationScreen';
import WineAddScreen from '../screens/WineAddScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import SettingScreen from '../screens/SettingScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import RecommendationResultScreen from '../screens/RecommendationResultScreen';
import RecommendationListScreen from '../screens/RecommendationListScreen';
import SearchResultScreen from '../screens/SearchResultScreen';
import WishlistScreen from '../screens/WishlistScreen';

const Stack = createNativeStackNavigator();

// 모든 스크린을 등록하고 navigation.navigate로 이동하는 방식으로 변경
export default function RootNavigator() {
  const { isLoggedIn, isLoading, isNewUser } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // 최소 2초간 스플래시 화면 유지
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || showSplash) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
    >
      {isLoggedIn ? (
        // 로그인 상태일 때
        isNewUser ? (
          // 신규 유저: 온보딩 및 결과 화면
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="RecommendationResult" component={RecommendationResultScreen} />
          </>
        ) : (
          // 기존 유저: 메인 및 전체 앱 기능 노출
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="WineDetail" component={WineDetailScreen} />
            <Stack.Screen name="MyWineDetail" component={MyWineDetailScreen} />
            <Stack.Screen name="Notification" component={NotificationScreen} />
            <Stack.Screen 
              name="WineAdd" 
              component={WineAddScreen} 
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="ProfileEdit" 
              component={ProfileEditScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Setting" component={SettingScreen} />
            <Stack.Screen name="RecommendationList" component={RecommendationListScreen} />
            <Stack.Screen name="SearchResult" component={SearchResultScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
          </>
        )
      ) : (
        // 비로그인 상태일 때
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
