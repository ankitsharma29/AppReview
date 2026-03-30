import React, { useRef, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { screenWidth } from '../helper/appUtils';
import Mixins from '../resource/mixins/appStyle'; 

import { getStyles } from './SnapCarouselStyle';

interface SnapCarouselProps {
  containerStyle?: StyleProp<ViewStyle> | undefined;
  data?: any;
  renderItem?: any;
  dotStyle?: StyleProp<ViewStyle> | undefined;
  inactiveDotStyle?: StyleProp<ViewStyle> | undefined;
  dotContainerStyle?: StyleProp<ViewStyle> | undefined;
  paginationContainerStyle?: StyleProp<ViewStyle> | undefined;
  sliderWidth?: number;
  itemWidth?: number;
  inactiveDotScale?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  autoplayInterval?: number;
  onSnapToItem?: (index: number) => void;
  needPagination?: boolean;
  scrollEnabled?: boolean;
  centerStyle?: any;
}

const { scaleSize } = Mixins;
const styles = getStyles();
const SnapCarousel = ({
  containerStyle = styles.container,
  data,
  renderItem,
  dotStyle = styles.dotStyle,
  inactiveDotStyle = styles.inactiveDotStyle,
  dotContainerStyle = styles.dotContainerStyle,
  paginationContainerStyle = styles.paginationContainerStyle,
  sliderWidth = screenWidth,
  itemWidth = screenWidth * 0.85,
  inactiveDotScale = 0.6,
  onSnapToItem,
  autoplay = true,
  autoplayDelay = 2000,
  autoplayInterval = 5000,
  needPagination = false,
  scrollEnabled = true,
  centerStyle,
}: SnapCarouselProps) => {
  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState<number>(0);

  return (
    <View style={[containerStyle, centerStyle]}>
      <Carousel
        layout={'default'}
        ref={carouselRef}
        data={data ?? []}
        renderItem={renderItem}
        sliderWidth={sliderWidth}
        itemWidth={itemWidth}
        onSnapToItem={index => {
          setActiveSlide(index);
          !!onSnapToItem && onSnapToItem(index);
        }}
        autoplay={autoplay}
        autoplayDelay={autoplayDelay}
        autoplayInterval={autoplayInterval}
        loop={autoplay}
        scrollEnabled={scrollEnabled}
      />
      {needPagination == true && (
        <Pagination
          dotsLength={data?.length}
          activeDotIndex={activeSlide}
          dotContainerStyle={dotContainerStyle}
          containerStyle={paginationContainerStyle}
          dotStyle={dotStyle}
          inactiveDotStyle={inactiveDotStyle}
          inactiveDotScale={inactiveDotScale}
        />
      )}
    </View>
  );
};

export default SnapCarousel;
