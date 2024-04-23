import { useEffect, useState } from 'react';
import * as RootNavigation from '../helper/RootNavigation';
import { Linking } from 'react-native';
import { NavigationType } from '../models/IAppModel';

export interface INotificationData {
  id: string;
  type: any;
  billerData?: any;
  webUrl?: any;
  screenNavigate?: any;
  typeData?: any;
}

export const useNotificationRedirection = () => {
  const handleNotificationClick =  (data: INotificationData) => {
    

    const url = data?.webUrl;
    if (url && url.length > 0) {
      if (url.includes('http://') || url.includes('https://')) {
        Linking.canOpenURL(url).then(() => {
          Linking.openURL(url);
        });
      }
    }
    switch (data.type) {
      case NavigationType.Registration:
        RootNavigation.navigate('HomeStack', {
          screen: 'Home' as any,
          initial: true,
        });
        break;
    
      default:
        RootNavigation.navigate('HomeStack', {
          screen: 'Home' as any,
          initial: true,
        });
    }
  };

  return { handleNotificationClick };
};
