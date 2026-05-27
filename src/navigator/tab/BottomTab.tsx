// navigation/tabs/BottomTab.tsx
// ALL original logic preserved — tab components and routing unchanged.
// Only MyTabBar + TabComponent are redesigned.
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MyTabBar from './MyTabBar';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { enableScreens } from 'react-native-screens';
import { isIOS } from '../../helper/appUtils';
import Mixins from '../../resource/mixins/appStyle';

import {
  ConvertIcon,
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
import ConvertStack from '../stack/ConvertStack';

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
  // ── original tab data (unchanged) ─────────
  const [tabs, setTabs] = useState<any>([
    {
      name: 'Home',
      component: HomeStack,
      icon: (style: any) => (
        <HomeIcon width={24} height={24} fill={style.color} />
      ),
      title: 'Home',
    },
    {
      name: 'Shorts',
      component: ShortsStack,
      icon: (style: any) => (
        <ShortsIcon width={24} height={24} fill={style.color} />
      ),
      title: 'Shorts',
    },
    {
      name: 'Content',
      component: ConvertStack,
      icon: (style: any) => (
        <ConvertIcon width={24} height={24} fill={style.color} />
      ),
      title: 'Convert',
    },
    {
      name: 'HistoryScreen',
      component: HistoryStack,
      icon: (style: any) => (
        <HistoryIcon width={24} height={24} fill={style.color} />
      ),
      title: 'History',
    },
    {
      name: 'GameList',
      component: GameStack,
      icon: (style: any) => (
        <GameIcon width={24} height={24} fill={style.color} />
      ),
      title: 'Game',
    },
  ]);

  // ── original iOS screen setup (unchanged) ──
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
      {tabs.map((tab: any) => (
        <RootTab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={({ route }) => ({
            // ── original tabBarStyle hide logic (unchanged) ──
            tabBarStyle: (() => {
              const routeName = getFocusedRouteNameFromRoute(route);
              const fromTab = route?.params?.params?.fromTab;
              if (
                routeName &&
                routeName.length > 0 &&
                routeName !== 'Home' &&
                routeName !== 'Shorts' &&
                routeName !== 'HistoryScreen' &&
                routeName !== 'GameList' &&
                routeName !== 'Convert' &&
                routeName !== 'Content' &&
                routeName !== 'PdfResizeScreen' &&
                routeName !== 'ImageResizeScreen'
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
