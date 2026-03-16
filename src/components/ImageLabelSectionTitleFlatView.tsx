import * as React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  Image,
  Text,
  FlatList,
} from 'react-native';
import ShadowRadiusView from './ShadowRadiusView';
import ViewAllSection from './ViewAllSection';
import Mixins from '../resource/mixins/appStyle';
import Colors from '../resource/theme/color';
import Fonts from '../resource/theme/font';
import {isValidUrl} from '../helper/appUtils';
import FastImage from 'react-native-fast-image';

export type IWidgets = {
  id: string;
  seq: number;
  type: string;
  data: any;
};

interface ImageLabelSectionTitleFlatViewProps {
  widget: IWidgets;
  style?: StyleProp<ViewStyle> | undefined;
  onItemPress?: (item: any) => void;
  onViewAllPress: () => void;
  isScrollable?: boolean;
}

const {scaleSize, scaleFont} = Mixins;

const ImageLabelSectionTitleFlatView = ({
  style,
  widget,
  onItemPress,
  onViewAllPress,
  isScrollable = false,
}: ImageLabelSectionTitleFlatViewProps) => {
  const [dimensions, setDimensions] = React.useState({width: 0, height: 0});

  const onPageLayout = event => {
    if (dimensions.width === 0 && dimensions.height === 0) {
      setDimensions({
        width: event.nativeEvent.layout.width,
        height: event.nativeEvent.layout.height,
      });
    }
  };

  const itemWidth = (dimensions.width - scaleSize(50)) / 4;
  const styles = getStyles(itemWidth);

  const renderItem = ({item, index}: any) => {
    
    return (
      <TouchableOpacity
        key={`Item_${index}`}
        style={[
          styles.button,
          !isScrollable && index % 3 !== 3
            ? styles.rightMargin
            : {marginHorizontal: 10},
        ]}
        onPress={() => !!onItemPress && onItemPress(item)}>
        <View style={styles.icon}>
          <FastImage
            source={{
              uri: isValidUrl(item?.images?.cover)
                ? item?.images?.cover
                : 'data:image/png;base64,' + item?.images?.cover,
            }}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.name}>{item?.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ShadowRadiusView style={[style, styles.container]}>
      <ViewAllSection
        title={widget?.title}
        showViewAll={widget?.showViewAll}
        onViewAllPress={onViewAllPress}
      />
      <View style={styles.gridView} onLayout={onPageLayout}>
        <FlatList
          horizontal={isScrollable}
          {...(isScrollable ? {} : {numColumns: 4})}
          showsHorizontalScrollIndicator={true}
          automaticallyAdjustsScrollIndicatorInsets={true}
          data={widget?.data?.slice(50,58) ?? []}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      </View>
    </ShadowRadiusView>
  );
};

export default ImageLabelSectionTitleFlatView;

const getStyles = (width: number) =>
  StyleSheet.create({
    container: {
      padding: 10,
      paddingHorizontal: scaleSize(10),
      marginVertical: scaleSize(5),
      borderWidth: 1,
      borderColor:Colors.black(),
      backgroundColor: Colors.white(),
    },
    gridView: {
      marginHorizontal: scaleSize(10),
      flexDirection: 'row',
      flexWrap: 'wrap',
      // justifyContent: 'space-between',
      // alignItems: 'center',
    },
    button: {
      width,
      marginTop: scaleSize(20),
      alignItems: 'center',
      gap: 5,
    },
    rightMargin: {
      marginRight: scaleSize(20),
    },
    icon: {
      width: width * 0.9,
      height: width * 0.74,
      backgroundColor: Colors.gray12(),
      borderRadius: scaleSize(8),
    },
    name: {
      fontFamily: Fonts.SemiBold,
      fontSize: scaleFont(14),
      color: Colors.black(),
      textAlign: 'center',
    },
  });
