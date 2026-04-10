import React, { useEffect, useRef } from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../resource/theme/color';
import { navigationRef, onReady } from '../helper/RootNavigation';
import { trackScreenView } from '../helper/ScreenTracking';
import PushNotification from 'react-native-push-notification';
import PushNotificationIos from '@react-native-community/push-notification-ios';
import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import notificationManager from '../helper/notificationManager';
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import { subscribeTopic } from '../helper/appUtils';
import BottomTab from '../navigator/tab/BottomTab';

const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerShown: true,
  gestureDirection: 'horizontal',
  headerTintColor: 'black',
  headerTitleAlign: 'center',
  headerStyle: { backgroundColor: Colors.orange1() },
};
const Navigation = () => {
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
          const { foreground, userInteraction, title, message } = notification;
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
          bigPictureUrl:
            remoteMessage?.notification?.android?.imageUrl ??
            remoteMessage?.data?.imageUrl,
          smallIcon:
            remoteMessage?.notification?.android?.imageUrl ??
            remoteMessage?.data?.imageUrl,
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
        // const fcmToken = await messaging().getToken();
        subscribeTopic('AppGrow');
        // if (fcmToken) {
        //   console.log('fcmToken', fcmToken);

        //   // Alert.alert(fcmToken);
        // }
      } catch (err) {
        // Alert.alert('Error occured while getting token.');
      }
    }
  };

  const routeNameRef = useRef();

  // Your Firebase config
  const firebaseConfig = {
    // Your config details here
  };

  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

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
      }}
    >
      <StatusBar
        backgroundColor={Colors.gradientTop()}
        barStyle={'dark-content'}
        translucent={true}
        showHideTransition={'fade'}
      />

      <BottomTab />
    </NavigationContainer>
  );
};

export default Navigation;
