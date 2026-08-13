import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import MyWineScreen from "../screens/MyWineScreen";
import FeedScreen from "../screens/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { CustomTabBar } from "../components/navigation/CustomTabBar";

const Tab = createBottomTabNavigator();

import { useTranslation } from "react-i18next";

export default function MainTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t("tab.home", "홈"), // Used for accessibility in CustomTabBar
        }}
      />
      {/* 검색 탭은 스택 화면으로 이동(홈 검색바 진입) — 자리는 소셜 피드가 대체 */}
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: t("tab.feed", "피드"),
        }}
      />
      <Tab.Screen
        name="MyWine"
        component={MyWineScreen}
        options={{
          tabBarLabel: t("tab.myWine", "내 와인"),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("tab.profile", "마이페이지"),
        }}
      />
    </Tab.Navigator>
  );
}
