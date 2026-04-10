import React, {useContext} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {BottomTabDescriptorMap} from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import {ParamListBase, TabNavigationState} from '@react-navigation/native';
import {EdgeInsets, useSafeAreaInsets} from 'react-native-safe-area-context';
import Colors from '../../resource/theme/color';
import Mixins from '../../resource/mixins/appStyle';
import TabComponent from '../../components/TabComponent';
import {isIOS} from '../../helper/appUtils';
import {AppContext} from '../../context/AppProvider';
import LinearGradient from 'react-native-linear-gradient';

interface MyTabBarProps {
  state: TabNavigationState<ParamListBase>;
  descriptors: BottomTabDescriptorMap;
  navigation: any;
  tabs: Array<any>;
}

const {scaleSize} = Mixins;

const MyTabBar = ({state, descriptors, navigation, tabs}: MyTabBarProps) => {
  const insets = useSafeAreaInsets();
  const {isUserLoggedIn,setCarStack} = useContext(AppContext);

  const styles = getStyles(insets);
  const focusedOptions: any =
    descriptors[state.routes[state.index].key].options;

  if (focusedOptions?.tabBarStyle?.display === 'none') {
    return null;
  }

  return (
    <LinearGradient
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      colors={[Colors.white(), Colors.white()]}
      style={[styles.tabBar]}>
      {state.routes.map((route: any, index: number) => {
        const {options} = descriptors[route.key];
        const isFocused = state.index === index;

        const onTabPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && route.name =='Collection') {
            setCarStack('CarCollection');
          } else {
            
          }
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({name: route.name, merge: true});
          }
        };

        return (
          <TabComponent
            isFocused={isFocused}
            index={index}
            options={options}
            tabs={tabs}
            key={`tab-${index}`}
            onTabPress={onTabPress}
          />
        );
      })}
    </LinearGradient>
  );
};

const getStyles = (inset: EdgeInsets) =>
  StyleSheet.create({
    tabBar: {
      flexDirection: 'row',
      // backgroundColor: Colors.blue2(),
      borderTopLeftRadius: scaleSize(10),
      borderTopRightRadius: scaleSize(10),
      // paddingBottom: inset.bottom / 2,
      paddingVertical: isIOS ? scaleSize(0) : scaleSize(10),
      elevation: 5,
      shadowColor: Colors.black(),
      shadowOpacity: 0.25,
      shadowRadius: 4,
      shadowOffset: {
        width: 0,
        height: 2,
      },
    },
  });

export default MyTabBar;
