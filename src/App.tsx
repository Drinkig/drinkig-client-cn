import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { UserProvider } from './context/UserContext';
import { WineProvider } from './context/WineContext';
import { GlobalUIProvider } from './context/GlobalUIContext';
import GlobalComponents from './components/GlobalComponents';


export default function App() {
  return (
    <SafeAreaProvider>
      <GlobalUIProvider>
        <GlobalComponents />
        <UserProvider>
          <WineProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </WineProvider>
        </UserProvider>
      </GlobalUIProvider>
    </SafeAreaProvider>
  );
}
