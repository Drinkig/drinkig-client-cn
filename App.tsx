import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { UserProvider } from './src/context/UserContext';
import { WineProvider } from './src/context/WineContext';
import { GlobalUIProvider } from './src/context/GlobalUIContext';
import GlobalComponents from './src/components/GlobalComponents';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        const hasMigrated = await AsyncStorage.getItem('MIGRATION_CHECK_V2');
        if (!hasMigrated) {
          // 2.0.0 업데이트 또는 신규 설치 시 최초 1회 실행
          await AsyncStorage.clear();
          await AsyncStorage.setItem('MIGRATION_CHECK_V2', 'true');
          console.log('[App] 2.0.0 Clean start initiated.');
        }
      } catch (error) {
        console.error('[App] Migration check failed:', error);
      } finally {
        setIsReady(true);
      }
    };
    initializeApp();
  }, []);

  if (!isReady) {
    return <></>; // 초기화 중에는 빈 화면 반환
  }

  return (
    <UserProvider>
      <WineProvider>
        <GlobalUIProvider>
          <NavigationContainer>
            <RootNavigator />
            <GlobalComponents />
          </NavigationContainer>
        </GlobalUIProvider>
      </WineProvider>
    </UserProvider>
  );
}

export default App;
