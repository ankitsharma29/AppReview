import { NetInfoState } from '@react-native-community/netinfo';
export interface NavProps {
  navigation: any;
}

export interface IAppModel {
  isDarkMode: Boolean;
  setDarkMode: (value: boolean) => void;
  isUserLoggedIn: Boolean;
  setUserLoggedIn: (value: boolean) => void;

  isNavigateToDashboard: Boolean;
  navigateToDashboard: (val?: boolean) => void;
  isNavigateToLogout: Boolean;
  navigateToLogout: (val?: boolean) => void;
  isInternetConnected: boolean;
  fetchNetworkInfo: () => Promise<any>;
  refreshNetworkInfo: () => Promise<any>;
  isUserLogout: boolean;
  setIsUserLogout: (val: boolean) => void;
  netInfo: NetInfoState | undefined;
  setNetInfo: (val: NetInfoState) => void;
  setLanguage: (language: any) => void;
  Language: any;
  setAppScreenClick: (val: any) => void;
  AppScreenClick: any;
  setAppScreenRoutetype: (val: any) => void;
  AppScreenRoutetype: any;
}
export enum NavigationType {
  Registration = 'registration',
}