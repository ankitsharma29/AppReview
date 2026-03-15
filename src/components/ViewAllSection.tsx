import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  TextStyle,
} from 'react-native';
import Mixins from '../resource/mixins/appStyle';
import Colors from '../resource/theme/color';
import Fonts from '../resource/theme/font';
interface ViewAllSectionProps {
  title: string;
  style?: StyleProp<ViewStyle> | undefined;
  titleStyle?: StyleProp<TextStyle> | undefined;
  showViewAll?: boolean;
  onViewAllPress: () => void;
}

const {scaleSize, scaleFont} = Mixins;

const ViewAllSection = ({
  title,
  style,
  titleStyle,
  showViewAll = false,
  onViewAllPress,
}: ViewAllSectionProps) => {
  const styles = getStyles();
  console.log("title",title);
  
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {showViewAll && (
        <>
          <TouchableOpacity
            onPress={onViewAllPress}
            style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.viewAllTxt}>View All</Text>
            {/* <RightArrowNew height={14} width={14} /> */}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default ViewAllSection;

const getStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: Fonts.Bold,
      fontSize: scaleFont(20),
      color: Colors.black(),
    },
    viewAll: {
      fontFamily: Fonts.Medium,
      fontSize: scaleFont(14),
      color: Colors.blue2(),
    },
    viewAllButton: {
      padding: scaleSize(5),
      // backgroundColor: Colors.softBlue(0.3),
      borderRadius: 20,
      paddingHorizontal: scaleSize(10),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.1,
      elevation: 5,
    },
    viewAllTxt: {
      fontFamily: Fonts.Bold,
      fontSize: scaleFont(16),
      color: Colors.black(),
      textAlign: 'center',
      marginRight: scaleSize(5),
    },
  });
