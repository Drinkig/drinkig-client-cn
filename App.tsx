import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { UserProvider } from './src/context/UserContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { WineProvider } from './src/context/WineContext';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <UserProvider>
      <NotificationProvider>
        <WineProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </WineProvider>
      </NotificationProvider>
    </UserProvider>
  );
}

export default App;
