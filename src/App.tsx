import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { UserProvider } from './context/UserContext';
import { WineProvider } from './context/WineContext';
import { NotificationProvider } from './context/NotificationContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <WineProvider>
          <NotificationProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </NotificationProvider>
        </WineProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
