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
import TastingNoteWriteScreen from '../screens/TastingNoteWriteScreen';
import TastingNoteDetailScreen from '../screens/TastingNoteDetailScreen';
import SearchScreen from '../screens/SearchScreen';

const Stack = createNativeStackNavigator();


export default function RootNavigator() {
  const { isLoggedIn, isLoading, isNewUser } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {

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

        isNewUser ? (

          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="RecommendationResult" component={RecommendationResultScreen} />
          </>
        ) : (

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
            <Stack.Screen name="WineSearch" component={SearchScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen name="TastingNoteWrite" component={TastingNoteWriteScreen} />
            <Stack.Screen name="TastingNoteDetail" component={TastingNoteDetailScreen} />
            <Stack.Screen name="WithdrawRetention" component={require('../screens/WithdrawRetentionScreen').default} />
            <Stack.Screen name="WithdrawReason" component={require('../screens/WithdrawReasonScreen').default} />
          </>
        )
      ) : (

        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
