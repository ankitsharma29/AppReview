import {View, Text, StatusBar, Platform} from 'react-native';
import React, {useEffect} from 'react';
import HomeScreen from './src/screens/Home/HomeScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Colors from './src/resource/theme/color';
import PageWindow from './src/screens/PageWindow/PageWindow';
import WebViewWindow from './src/screens/WebViewWindow/WebViewWindow';
import WebViewPage from './src/components/WebViewPage';
import {navigationRef, onReady} from './src/helper/RootNavigation';
import {trackScreenView} from './src/helper/ScreenTracking';
import PushNotification from 'react-native-push-notification';
import PushNotificationIos from '@react-native-community/push-notification-ios';
import {check, PERMISSIONS, RESULTS, request} from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import notificationManager from './src/helper/notificationManager';

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
  // configure the push notification once, and use it on any screen
  useEffect(() => {
    notificationManager.configure();
  }, []);

  useEffect(() => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message handled', remoteMessage);
    });

    PushNotification.configure({
      onNotification: notification => {
        if (notification) {
          const {foreground, userInteraction, title, message} = notification;
          if (foreground && (title || message) && !userInteraction)
            PushNotification.localNotification(notification);

          const clicked = notification.userInteraction;
          if (clicked)
            if (Platform.OS == 'ios')
              // handleNotificationClick(notification.data as INotificationData);

              notification.finish(PushNotificationIos.FetchResult.NoData);
        }
      },
    });

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('remoteMessage', remoteMessage);

      if (Platform.OS == 'ios') {
        PushNotificationIos.addNotificationRequest({
          id: remoteMessage?.messageId || '',
          body: remoteMessage?.notification?.body,
          title: remoteMessage?.notification?.title,
          userInfo: remoteMessage?.data,
        });
      } else {
        PushNotification.createChannel(
          {
            channelId: 'AppReview', // (required)
            channelName: 'AppReview', // (required)
            channelDescription: 'Notification for View Grow', // (optional) default: undefined.
            importance: 4, // (optional) default: 4. Int value of the Android notification importance
            vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
          },
          created => console.log(`createChannel returned ${created}`), // (optional) callback returns whether the channel was created, false means it already existed.
        );

        PushNotification.localNotification({
          channelId: 'AppReview',
          message: remoteMessage?.notification?.body ?? '',
          title: remoteMessage?.notification?.title,
          bigPictureUrl: remoteMessage?.notification?.android?.imageUrl,
          smallIcon: remoteMessage?.notification?.android?.imageUrl,
          userInfo: remoteMessage?.data,
          vibrate: true,
          vibration: 3000,
          priority: 'high',
        });
      }
    });

    // registerAppWithFCM();

    return unsubscribe;
  }, []);

  useEffect(() => {
    requestUserPermission();
  }, []);

  async function registerAppWithFCM() {
    await messaging().registerDeviceForRemoteMessages();
  }

  const requestNotificationPermission = async () => {
    const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    return result;
  };

  const checkNotificationPermission = async () => {
    const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    return result;
  };

  const requestPermission = async () => {
    const checkPermission = await checkNotificationPermission();
    console.log('checkPermission', checkPermission);

    if (checkPermission != RESULTS.GRANTED) {
      const request = await requestNotificationPermission();

      console.log('request', request);

      // if (request !== RESULTS.GRANTED) {
      //   await requestNotificationPermission();
      //   // permission not granted
      // }
    }
  };

  const requestUserPermission = async () => {
    requestPermission();
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      try {
        const fcmToken = await messaging().getToken();

        if (fcmToken) {
          console.log('fcmToken', fcmToken);

          // Alert.alert(fcmToken);
        }
      } catch (err) {
        // Alert.alert('Error occured while getting token.');
      }
    }
  };

  const routeNameRef = React.useRef();
  return (
    <NavigationContainer
      ref={navigationRef}
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
        backgroundColor={Colors.gradientBottom()}
        barStyle={'dark-content'}
        translucent={false}
      />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={stackScreenOptions}>
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
