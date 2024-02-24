import React from 'react';
import {Text, View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import Mixins from '../resource/mixins/appStyle';
import Colors from '../resource/theme/color';
import Fonts from '../resource/theme/font';

interface ErrorComponentProps {
  message: string | undefined;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
}

const {scaleSize, scaleFont} = Mixins;

const ErrorComponent = ({message, style, textStyle}: ErrorComponentProps) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.messageStyle, textStyle]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.red(),
    width: '100%',
  },
  messageStyle: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: scaleFont(16),
    color: Colors.white(),
    padding: scaleSize(10),
  },
});

export default ErrorComponent;
