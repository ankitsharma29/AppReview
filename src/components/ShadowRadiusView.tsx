import * as React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import Mixins from '../resource/mixins/appStyle';
import Colors from '../resource/theme/color';


interface ShadowRadiusViewProps {
  style?: StyleProp<ViewStyle> | undefined;
  children: JSX.Element | JSX.Element[] | undefined;
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;
}

const {scaleSize} = Mixins;

const ShadowRadiusView = ({
  style,
  onLayout,
  children,
}: ShadowRadiusViewProps) => {
  const styles = getStyles();
  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {children}
    </View>
  );
};

export default ShadowRadiusView;

const getStyles = () =>
  StyleSheet.create({
  container: {
    padding: scaleSize(15),
    borderRadius: scaleSize(15),
    backgroundColor:Colors.headerColor(),
    borderColor: Colors.borderColor(),
    borderWidth: 0.5,
  },
});
