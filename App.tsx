import {View, Text, StatusBar} from 'react-native';
import React from 'react';
import HomeScreen from './src/screens/Home/HomeScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Colors from './src/resource/theme/color';
import PageWindow from './src/screens/PageWindow/PageWindow';
import WebViewWindow from './src/screens/WebViewWindow/WebViewWindow';
import WebViewPage from './src/components/WebViewPage';
import { navigationRef, onReady } from './src/helper/RootNavigation';
import { trackScreenView } from './src/helper/ScreenTracking';

const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerShown: true,
  gestureDirection: 'horizontal',
  headerMode: 'screen',
  headerTintColor: 'black',
  headerTitleAlign: 'center',
  headerStyle: {backgroundColor: Colors.gradientBottom()},
  cardStyleInterpolator: ({current, layouts}) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    };
  },
};
const App = () => {
  const routeNameRef = React.useRef();
  return (
    <NavigationContainer ref={navigationRef}
    onReady={onReady}
    onStateChange={async () => {
      const previousRouteName = routeNameRef.current;
      const currentRouteName = navigationRef.getCurrentRoute().name;

      if (previousRouteName !== currentRouteName) {
        routeNameRef.current = currentRouteName;
        await trackScreenView(currentRouteName, 'AppReview');
      }
    }}>
      <StatusBar
        backgroundColor={'white'}
        barStyle={'dark-content'}
        translucent={false}
      />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={stackScreenOptions}
        >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Get more view & Watch Time',
          }}
          
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PageWindow" component={PageWindow} />
        <Stack.Screen name="WebViewWindow" component={WebViewWindow} />
        <Stack.Screen name="WebViewPage" component={WebViewPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
