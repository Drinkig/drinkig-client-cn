import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { UserProvider } from './src/context/UserContext';
import { WineProvider } from './src/context/WineContext';
import { GlobalUIProvider } from './src/context/GlobalUIContext';
import GlobalComponents from './src/components/GlobalComponents';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
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
