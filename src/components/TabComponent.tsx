import React, {useContext} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Alert} from 'react-native';
import {isIOS} from '../helper/appUtils';
import Mixins from '../resource/mixins/appStyle';
import Colors from '../resource/theme/color';
import Fonts from '../resource/theme/font';
import {BlurView} from '@react-native-community/blur';

interface TabComponentProps {
  isFocused: boolean;
  index: number;
  options: any;
  tabs: Array<any>;
  onTabPress: () => void;
}

const {scaleSize, scaleFont} = Mixins;

const TabComponent = ({
  isFocused,
  index,
  options,
  tabs,
  onTabPress,
}: TabComponentProps) => {
  const styles = getStyle(isFocused);
  return (
    <TouchableOpacity
      key={`route_${index}`}
      accessibilityRole="button"
      accessibilityState={isFocused ? {selected: true} : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      style={styles.tabButton}
      onPress={onTabPress}>
      {/* <BlurView
        style={styles.absolute}
        blurType="light"
        blurAmount={0}
        reducedTransparencyFallbackColor="white"
      /> */}
      <View style={styles.tabBar}>
        {tabs[index].icon(styles.icon)}
        <Text style={styles.tabTitle}>{tabs[index].title}</Text>
        {isFocused && <View style={styles.bottomBar} />}
      </View>
    </TouchableOpacity>
  );
};

const getStyle = (isFocused: boolean) =>
  StyleSheet.create({
    tabBar: {
      width: scaleSize(75),
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: isIOS ? scaleSize(18) : scaleSize(0),
    },
    icon: {
      color: isFocused ? Colors.black() : '#7F7F7F',
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
    },
    tabTitle: {
      marginTop: scaleSize(10),
      fontFamily: Fonts.poppinsMedium,
      fontSize: scaleFont(16),
      color: isFocused ? Colors.black() : Colors.black(0.5),
    },
    iconContainer: {justifyContent: 'center', alignItems: 'center'},
    bottomBar: {
      width: '100%',
      marginTop: scaleSize(10),
      backgroundColor: Colors.white(),
      height: scaleSize(6),
      borderTopLeftRadius: scaleSize(10),
      borderTopRightRadius: scaleSize(10),
    },
    absolute: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    },
  });

export default TabComponent;
