import Geolocation from 'react-native-geolocation-service';
import {Alert, Dimensions, PermissionsAndroid, Platform, PixelRatio} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Moment from 'moment';
import { RFPercentage, RFValue } from "react-native-responsive-fontsize";
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const otpInputLength = 6;
export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    try {
      Geolocation.getCurrentPosition(
        pos => {
          const {coords} = pos;
          // console.log(coords);

          resolve(coords);
        },
        error => {
          reject(error);
        },
        
        {enableHighAccuracy: false, timeout: 15000},
      );
    } catch (error) {
      console.log(error);
    }
  });
};

const checkDevicePermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Access Required',
      message: 'LearnCode needs to Access your Location',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    },
  );

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    return true;
  } else {
    return false;
  }
};

const requestLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Geolocation Permission',
          message: 'Can we access your location?',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted;
    } else if (Platform.OS === 'ios') {
      return Geolocation.requestAuthorization('whenInUse');
    }
  } catch (err) {
    return false;
  }
};

export const fetchUserLocation = async () => {
  if (isIOS) {
    Geolocation.requestAuthorization('whenInUse');
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
    return getCurrentLocation();
  } else {
    try {
      if (await checkDevicePermission()) {
        return getCurrentLocation();
      } else {
        return null;
      }
    } catch (error: any) {
      console.log('fetch location error :', error);
      return null;
    }
  }
};

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
