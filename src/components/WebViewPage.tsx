import React, {useEffect, useRef} from 'react';
import {BackHandler, Image, StyleSheet, Text, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import CommonLoader from './CommonLoader';
import Colors from '../resource/theme/color';
import Mixins from '../resource/mixins/appStyle';
import {AppImages} from '../assets/constant';

// type WebViewPageProps = NativeStackScreenProps<
//   RootHomeStackParamList,
//   'WebViewPage'
// >;
const {scaleFont, scaleSize} = Mixins;
const WebViewPage = ({Requesturl, id}: any) => {
  const onNavigationStateChange = (navState: any) => {
    console.log('navState', navState);
  };

  const injectedJavaScript = `
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(meta);
    `;

  return (
    <View style={styles.subContainer}>
      <WebView
        source={{
          uri: Requesturl,
        }}
        originWhitelist={['https://*']}
        onLoad={() => {}}
        style={styles.container}
        startInLoadingState={true}
        renderLoading={() => <CommonLoader />}
        onNavigationStateChange={onNavigationStateChange}
        scalesPageToFit={false}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        onMessage={event => {}}
        scrollEnabled={false}
      />
    </View>
  );
};

export default WebViewPage;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  subContainer: {
    overflow: 'hidden',
    borderRadius: scaleSize(10),
    borderWidth: 1,
    borderColor: Colors.gray3(),
    margin: scaleSize(10),
    flexDirection: 'row',
    width: '90%',
    height: 200,
  },
});
