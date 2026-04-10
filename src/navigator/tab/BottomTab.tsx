import React, {useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MyTabBar from './MyTabBar';
import {
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { isIOS } from '../../helper/appUtils';
import Mixins from '../../resource/mixins/appStyle';

import {
  GameIcon,
  History,
  HistoryIcon,
  HomeIcon,
  ShortsIcon,
} from '../../assets/constant';
import HomeStack from '../stack/HomeStack';
import ShortsStack from '../stack/ShortsStack';
import HistoryStack from '../stack/HistoryStack';
import GameStack from '../stack/GameStack';

interface BottomTabProps {}

export type RootHomeTabParamList = {
  Home: String;
  Shop: String;
  Scan: String;
  Travel: String;
};

const { scaleSize, scaleFont } = Mixins;

const RootTab = createBottomTabNavigator<RootHomeTabParamList>();

const BottomTab = (_props: BottomTabProps) => {
  const [tabs, setTabs] = useState<any>([
    {
      name: 'Home',
      component: HomeStack,
      icon: (style: any) => (
        <HomeIcon width={30} height={30} fill={style.color} />
      ),
      title: 'Home',
    },
    {
      name: 'Shorts',
      component: ShortsStack,
      icon: (style: any) => (
        <ShortsIcon width={30} height={30} fill={style.color} />
      ),
      title: 'Shorts',
    },
    {
      name: 'HistoryScreen',
      component: HistoryStack,
      icon: (style: any) => (
        <HistoryIcon width={30} height={30} fill={style.color} />
      ),
      title: 'History',
    },
    {
      name: 'GameList',
      component: GameStack,
      icon: (style: any) => (
        <GameIcon width={30} height={30} fill={style.color} />
      ),
      title: 'Game',
    },
  ]);

  React.useEffect(() => {
    if (isIOS) {
      enableScreens(false);
    }
  }, []);

  return (
    <RootTab.Navigator
      screenOptions={{ unmountOnBlur: true }}
      tabBar={props => <MyTabBar tabs={tabs} {...props} />}
    >
      {tabs.map((tab, index) => (
        <RootTab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={({ route }) => ({
            tabBarStyle: (() => {
              const routeName = getFocusedRouteNameFromRoute(route);
              // This key is used to show or hide the bottom tab bar
              const fromTab = route?.params?.params?.fromTab;
              if (
                routeName &&
                routeName.length > 0 &&
                routeName !== 'Home' &&
                routeName !== 'Shorts' && 
                routeName !== 'HistoryScreen' && 
                routeName !== 'GameList'  
              ) {
                return { display: 'none' };
              }

              return;
            })(),
            headerShown: false,
          })}
        />
      ))}
    </RootTab.Navigator>
  );
};

export default BottomTab;
