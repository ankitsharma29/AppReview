// ScreenTracking.js

import analytics from '@react-native-firebase/analytics';

export const trackScreenView = async (screenName, screenClass) => {
  console.log('Tracking Screen', screenName);
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenClass,
  });

  analytics().setUserProperty('active_screen', screenName);
};
