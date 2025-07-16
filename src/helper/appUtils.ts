import { Alert, Dimensions, PermissionsAndroid, Platform, PixelRatio, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Moment from 'moment';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const otpInputLength = 6;
export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;
import crashlytics from '@react-native-firebase/crashlytics';
import messaging from '@react-native-firebase/messaging';

export const getDeviceModel = () => {
  return DeviceInfo.getModel();
};

export const convertDate = (date: Date, format: string) => {
  return Moment(date).format(format);
};

export const convertTime = (date: Date, format: string) => {
  return Moment(date).format(format);
};

const fontScale = PixelRatio.getFontScale();
export const getFontSize = (size: number) => size / fontScale;

export const setFont = (value: number, standardScreenHeight?: number): number => {
  return RFValue(value, standardScreenHeight)

}

export const openUrl = (url: any) => {
  Linking.canOpenURL(url).then(() => {
    Linking.openURL(url);
  });
};

export const isValidUrl = (url: string) => {
  try {
    if (
      url != undefined &&
      (url.indexOf('http://') === 0 || url.indexOf('https://') === 0)
    ) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};


export const setCrashlaticsLog = async (message: any) => {
  console.log("message", message);

  await crashlytics().log(message);
}

export const setCrashlaticsAttaributs = async (data: any) => {
  await crashlytics().setAttributes(data)

}


export const subscribeTopic = async (topic: any) => {
  messaging()
    .subscribeToTopic(topic)
    .then(() => console.log('Subscribed to topic:', topic))
    .catch(e => {
      console.log(e);
    });
};
