import {Alert, Dimensions, PermissionsAndroid, Platform, PixelRatio, Linking} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Moment from 'moment';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const otpInputLength = 6;
export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;

export const fetchDeniedPopUp = () => {
  Alert.alert(
    'Permission Denied',
    'You must have to grant the location permission for accessing the app.',
    [
      {
        text: 'Ok',
        onPress: () => {
          console.log('Fetch Pop Up Okay Pressed.');
          fetchUserLocation();
        },
      },
    ],
    // {cancelable: false},
  );
};

export const fetchLocationFlag = () => {
  if (fetchUserLocation() != null) return true;
  else return false;
};

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

export const setFont = (value: number, standardScreenHeight?: number): number =>  {
  return RFValue(value,standardScreenHeight)
   
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