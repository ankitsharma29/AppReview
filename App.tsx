import React, {useContext, useEffect} from 'react';
import {Provider} from 'react-redux';
import {Platform, Text, TextInput} from 'react-native';

import {AppContext, AppProvider} from './src/context/AppProvider';
import SafeAreaComponent from './src/screens/SafeAreaComponent';
import store from './src/store/store';
import Toast, {ErrorToast, SuccessToast} from 'react-native-toast-message';
const toastConfig = {
  success: (props: any) => (
    <SuccessToast {...props} text1NumberOfLines={0} text2NumberOfLines={0} />
  ),
  error: (props: any) => (
    <ErrorToast {...props} text1NumberOfLines={0} text2NumberOfLines={0} />
  ),
};

// Set the custom Text component as the default Text component.
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps = {...Text.defaultProps, ...{allowFontScaling: false}};
TextInput.defaultProps = {
  ...TextInput.defaultProps,
  ...{allowFontScaling: false},
};
const App = () => {
  return (
    <Provider store={store}>
      <AppProvider>
        <SafeAreaComponent edges={['top', 'right', 'left']} />
        <Toast config={toastConfig} />
      </AppProvider>
    </Provider>
  );
};

export default App;
