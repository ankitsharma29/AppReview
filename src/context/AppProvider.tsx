import React, {useCallback, useEffect, useState} from 'react';
import {Alert, useColorScheme} from 'react-native';
import * as RNLocalize from 'react-native-localize';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {
  IAppModel,
} from '../models/IAppModel';

const AppContext = React.createContext<IAppModel>({
  isDarkMode: false,
  setDarkMode: (_value: boolean) => {},
  isUserLoggedIn: false,
  setUserLoggedIn: (_value: boolean) => {},
  isNavigateToDashboard: false,
  navigateToDashboard: () => {},
  isNavigateToLogout: false,
  navigateToLogout: () => {},
  isInternetConnected: true,
  fetchNetworkInfo: () => {
    return new Promise((_resolve, _reject) => {});
  },
  refreshNetworkInfo: () => {
    return new Promise((_resolve, _reject) => {});
  },
  isUserLogout: false,
  setIsUserLogout: (_val: boolean) => {},
  netInfo: undefined,
  setNetInfo: (_val: NetInfoState) => {},
  setLanguage: (_id: any) => {},
  Language: '',
  setAppScreenClick: (val: any) => {},
  AppScreenClick: '',
  setAppScreenRoutetype: (val: any) => {},
  AppScreenRoutetype: ''
});

const AppProvider = (props: any) => {
  const isDarkTheme = useColorScheme() === 'dark';
  const [isDarkMode, setDarkMode] = React.useState(isDarkTheme);
  const [AppScreenClick, setAppScreenClick] = React.useState<string>('');
  const [AppScreenRoutetype, setAppScreenRoutetype] =
    React.useState<string>('');
  const [isUserLoggedIn, setUserLoggedIn] = React.useState(false);
  const [isNavigateToDashboard, setNavigateToDashboard] = React.useState(false);
  const [isNavigateToLogout, setNavigateToLogout] = React.useState(false);
  const [isInternetConnected, setIsInternetConnected] =
    React.useState<boolean>(true);
  const [isUserLogout, setIsUserLogout] = React.useState<boolean>(false);
  const [netInfo, setNetInfo] = React.useState<NetInfoState | undefined>(
    undefined,
  );


  const fetchNetworkInfo = () => {
    return NetInfo.fetch();
  };

  const refreshNetworkInfo = async () => {
    try {
      const {isConnected} = await NetInfo.refresh();
      setIsInternetConnected(isConnected ?? true);
      return isConnected;
    } catch (err) {
      return false;
    }
  };

  const handleNetworkState = state => {
    setIsInternetConnected(state.isConnected ?? true);
  };


  const navigateToDashboard = useCallback((val: boolean = true) => {
    setNavigateToDashboard(val);
  }, []);

  const navigateToLogout = useCallback((val: boolean = true) => {
    setNavigateToLogout(val);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        setDarkMode,
        isUserLoggedIn,
        setUserLoggedIn,
        isNavigateToDashboard,
        navigateToDashboard,
        isNavigateToLogout,
        navigateToLogout,
        isInternetConnected,
        fetchNetworkInfo,
        refreshNetworkInfo,
        isUserLogout,
        setIsUserLogout,
        netInfo,
        setNetInfo,
        setAppScreenClick,
        AppScreenClick,
        setAppScreenRoutetype,
        AppScreenRoutetype,
      }}>
      {props.children}
    </AppContext.Provider>
  );
};

export {AppContext, AppProvider};
