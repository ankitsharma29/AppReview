import {StyleSheet} from 'react-native';
import Mixins from '../resource/mixins/appStyle'; 
import Colors from '../resource/theme/color';
const {scaleSize} = Mixins;

export const getStyles = () =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    paginationContainerStyle: {
      position: 'absolute',
      paddingVertical: scaleSize(15),
      alignSelf: 'center',
      bottom: 0,
    },
    dotContainerStyle: {
      marginHorizontal: scaleSize(4),
    },
    dotStyle: {
      width: scaleSize(6),
      height: scaleSize(6),
      borderRadius: scaleSize(6),
      backgroundColor: Colors.white(),
    },
    inactiveDotStyle: {
      width: scaleSize(6),
      height: scaleSize(6),
      borderRadius: scaleSize(6),
      backgroundColor: Colors.ButtonBgColor(),
    },
  });
