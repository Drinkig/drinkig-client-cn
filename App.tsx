import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from './src/screens/LoginScreen';
import { HomeScreen, SearchScreen } from './src/screens/TabScreens';
import MyWineScreen from './src/screens/MyWineScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import SettingScreen from './src/screens/SettingScreen';
import WineAddScreen from './src/screens/WineAddScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from './src/types';
import { UserProvider } from './src/context/UserContext';
import { WineProvider } from './src/context/WineContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#8e44ad', // 활성화 색상 (와인색)
        tabBarInactiveTintColor: '#888', // 비활성화 색상
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'MyWine') {
            iconName = focused ? 'bottle-wine' : 'bottle-wine-outline';
            return <MaterialIcon name={iconName} size={size} color={color} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName as string} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: '검색' }} />
      <Tab.Screen name="MyWine" component={MyWineScreen} options={{ title: '내 와인' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '프로필' }} />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  return (
    <UserProvider>
      <WineProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="ProfileEdit" 
              component={ProfileEditScreen} 
              options={{ 
                presentation: 'modal', // 모달 형태로 띄우기
                headerShown: false 
              }} 
            />
            <Stack.Screen name="Setting" component={SettingScreen} />
            <Stack.Screen 
              name="WineAdd" 
              component={WineAddScreen} 
              options={{ 
                presentation: 'modal', // 모달 형태로 띄우기
                headerShown: false 
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </WineProvider>
    </UserProvider>
  );
}

export default App;
