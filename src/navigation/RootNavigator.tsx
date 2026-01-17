import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import CountrySelectionScreen from "../screens/CountrySelectionScreen";
import FoodPairingResultScreen from "../screens/FoodPairingResultScreen";
import FoodSelectionScreen from "../screens/FoodSelectionScreen";
import LoginScreen from "../screens/LoginScreen";
import MyWineDetailScreen from "../screens/MyWineDetailScreen";
import NotificationScreen from "../screens/NotificationScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import PlaceSelectionScreen from "../screens/PlaceSelectionScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import RecommendationListScreen from "../screens/RecommendationListScreen";
import RecommendationResultScreen from "../screens/RecommendationResultScreen";
import SearchResultScreen from "../screens/SearchResultScreen";
import SearchScreen from "../screens/SearchScreen";
import SettingScreen from "../screens/SettingScreen";
import SplashScreen from "../screens/SplashScreen";
import TastingNoteDetailScreen from "../screens/TastingNoteDetailScreen";
import TastingNoteWriteScreen from "../screens/TastingNoteWriteScreen";
import WineAddScreen from "../screens/WineAddScreen";
import WineDetailScreen from "../screens/WineDetailScreen";
import WishlistScreen from "../screens/WishlistScreen";
import MainTabNavigator from "./MainTabNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoggedIn, isLoading, isNewUser } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // JS Splash Screen delay - keeps the splash visible while JS loads or for a minimum time
    // The user explicitly wants the JS splash.
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2 seconds delay as before

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || showSplash) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        isNewUser ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen
              name="RecommendationResult"
              component={RecommendationResultScreen}
            />
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
              options={{ presentation: "transparentModal" }}
            />
            <Stack.Screen
              name="ProfileEdit"
              component={ProfileEditScreen}
              options={{ presentation: "transparentModal" }}
            />
            <Stack.Screen name="Setting" component={SettingScreen} />
            <Stack.Screen
              name="RecommendationList"
              component={RecommendationListScreen}
            />
            <Stack.Screen name="SearchResult" component={SearchResultScreen} />
            <Stack.Screen name="WineSearch" component={SearchScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen
              name="TastingNoteWrite"
              component={TastingNoteWriteScreen}
            />
            <Stack.Screen
              name="TastingNoteDetail"
              component={TastingNoteDetailScreen}
            />
            <Stack.Screen
              name="WithdrawRetention"
              component={require("../screens/WithdrawRetentionScreen").default}
            />
            <Stack.Screen
              name="WithdrawReason"
              component={require("../screens/WithdrawReasonScreen").default}
            />

            {/* Food Pairing Flow */}
            <Stack.Screen
              name="PlaceSelection"
              component={PlaceSelectionScreen}
            />
            <Stack.Screen
              name="FoodSelection"
              component={FoodSelectionScreen}
            />
            <Stack.Screen
              name="CountrySelection"
              component={CountrySelectionScreen}
            />
            <Stack.Screen
              name="FoodPairingResult"
              component={FoodPairingResultScreen}
            />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
