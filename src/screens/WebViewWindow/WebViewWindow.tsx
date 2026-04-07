import React, {useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import WebViewPage from '../../components/WebViewPage';
import Mixins from '../../resource/mixins/appStyle';
import Colors from '../../resource/theme/color';
import WebView from 'react-native-webview';
import CommonLoader from '../../components/CommonLoader';
import Fonts from '../../resource/theme/font';
import {isIOS} from '../../helper/appUtils';
import BannerAds from '../../components/Ads/BannerAds';
import { BannerAdSize } from 'react-native-google-mobile-ads';
import Header from '../../components/Header';
const {scaleFont, scaleSize} = Mixins;
const WebViewWindow = ({navigation, route}: any) => {
  const inputRef = useRef(null);
  const data = route?.params?.item;
  const UrlWeb = route?.params?.link;
  const Customevalue = route?.params?.Customevalue;
  const windowScreen = route?.params?.windowScreen;

  const [webData, setwebData] = useState<any>([]);
  const [ViewShow, setViewShow] = useState<any>(0);

  const [timer, setTimer] = useState<number | any>(
    data.flag === 'addMinutes' ? route?.params?.CustomeMinutes : 60,
  );

  useEffect(() => {
    try {
      if (data.flag != 'autoPlay') {
        const interval = setInterval(() => {
          if (timer === 0 && interval) {
            console.log('clear');
            navigation.goBack();
            clearInterval(interval);
            return;
          }
          timer > 0 && setTimer(timer - 1);
        }, 1000);

        return () => {
          interval && clearInterval(interval);
        };
      }
    } catch (error) {
      console.log('error', error);
    }
  }, [timer]);

  // web url windows
  useEffect(() => {
    let windowArray: any = 0;
    if (Customevalue >= windowScreen) {
      windowArray = Customevalue;
    } else {
      windowArray = windowScreen;
    }
    setViewShow(windowArray);
    for (let value = 0; value < windowArray; value++) {
      setwebData((prevState: any) => [
        ...prevState,
        {
          url: UrlWeb,
          id: value,
        },
      ]);
    }
  }, []);

  const onFocusHandler = () => {
    if (Platform.OS === 'android') {
      console.log('inside onFocus');
    }
  };

  const onBlurHandler = () => {
    if (Platform.OS === 'android') {
      console.log('inside onBlur');
    }
  };
  return (
    <View style={{flex: 1, backgroundColor: Colors.white()}}>
      <Header title={'Browser Screen'} navigation={navigation} />
      <ScrollView>
        {(data.flag == 'oneMinute' || data.flag == 'addMinutes') && (
          <View
            style={{
              justifyContent: 'space-evenly',
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              margin: scaleSize(10),
            }}>
            <View style={[styles.TopView, {flex: 0.2}]}>
              <Text style={styles.textStyle}>{timer}</Text>
            </View>
            <View style={[styles.TopView, {flex: 0.6}]}>
              <Text style={styles.textStyleLine}>
                {data.flag == 'addMinutes'
                  ? ' Your Custome time complete after auto refresh'
                  : 'Your Video Must Be Longer Than One Minute'}
              </Text>
            </View>
            <View style={[styles.TopView, {flex: 0.4}]}>
              <Text style={styles.textStyle}>View: {ViewShow}</Text>
            </View>
          </View>
        )}
        <BannerAds BaneerSize={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} adUnitId={'ca-app-pub-4293747280421578/7057408451'}/>
        <View
          style={{
            flexWrap: 'wrap',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {webData.length != 0 &&
            webData.map((item: any) => (
              <>
                <WebViewPage Requesturl={item.url} />
              </>
            ))}
        </View>
        <BannerAds BaneerSize={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} adUnitId={'ca-app-pub-4293747280421578/8178918435'}/>
      </ScrollView>
    </View>
  );
};

export default WebViewWindow;

const styles = StyleSheet.create({
  subContainer: {
    borderRadius: scaleSize(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gradientTop(),
    margin: scaleSize(10),
    width: '40%',
    height: '25%',
  },
  TopView: {
    borderRadius: scaleSize(5),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.black(),
    padding: scaleSize(10),
    marginHorizontal: scaleSize(2),
    backgroundColor: Colors.gradientTop(),
  },
  textStyle: {
    color: Colors.white(),
    fontSize: scaleSize(18),
    fontFamily: Fonts.poppinsBold,
  },
  textStyleLine: {
    color: Colors.white(),
    fontSize: scaleSize(11),
    fontFamily: Fonts.poppinsSemiBold,
    textAlign: 'center',
  },
  input: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: scaleFont(16),
    color: Colors.black(),
    borderColor: Colors.lightWhite2(),
    borderWidth: 1,
    borderRadius: scaleSize(5),
    paddingHorizontal: isIOS ? scaleSize(0) : scaleSize(10),
  },
});
