import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import mobileAds from "react-native-google-mobile-ads";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { requestTrackingPermission } from "react-native-tracking-transparency";
import GlobalComponents from "./src/components/GlobalComponents";
import { GlobalUIProvider } from "./src/context/GlobalUIContext";
import { UserProvider } from "./src/context/UserContext";
import { WineProvider } from "./src/context/WineContext";
import { SubscriptionProvider } from "./src/context/SubscriptionContext";
import RootNavigator from "./src/navigation/RootNavigator";
import i18n, { getSystemLanguage } from "./src/i18n";

function App(): React.JSX.Element {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@app_language');
        if (savedLanguage && savedLanguage !== 'system') {
          i18n.changeLanguage(savedLanguage);
        } else if (savedLanguage === 'system') {
          i18n.changeLanguage(getSystemLanguage());
        }

        const hasMigrated = await AsyncStorage.getItem("MIGRATION_CHECK_V2");
        if (!hasMigrated) {
          // 2.0.0 업데이트 또는 신규 설치 시 최초 1회 실행
          await AsyncStorage.clear();
          await AsyncStorage.setItem("MIGRATION_CHECK_V2", "true");
          console.log("[App] 2.0.0 Clean start initiated.");
        }
      } catch (error) {
        console.error("[App] Migration check failed:", error);
      } finally {
        setIsReady(true);
        // ATT 권한 요청 (앱 로드 완료 후 약간의 딜레이를 두고 실행)
        setTimeout(async () => {
          const trackingStatus = await requestTrackingPermission();
          console.log("[App] ATT Status:", trackingStatus);
        }, 1000);
      }
    };
    initializeApp();

    // AdMob 초기화
    mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        console.log("[App] AdMob initialized:", adapterStatuses);
      });
  }, []);

  if (!isReady) {
    return <></>; // 초기화 중에는 빈 화면 반환
  }

  return (
    <UserProvider>
      <SubscriptionProvider>
        <WineProvider>
          <GlobalUIProvider>
            <SafeAreaProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </SafeAreaProvider>
            <GlobalComponents />
          </GlobalUIProvider>
        </WineProvider>
      </SubscriptionProvider>
    </UserProvider>
  );
}

export default App;
