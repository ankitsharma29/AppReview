import {Dimensions, PixelRatio, Platform} from 'react-native';
const isIOS = Platform.OS == 'ios';
const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;

const guidelineBaseWidth = 414;
const guidelineBaseHeight = 736;

const scaleSize = (size: number) => {
  const scaledWidth = (screenWidth / guidelineBaseWidth) * size;
  return scaledWidth < 1 ? scaledWidth : Math.floor(scaledWidth);
};

const scaleSizeHeight = (size: number) => {
  const scaledHeight = (screenHeight / guidelineBaseHeight) * size;
  return scaledHeight < 1 ? scaledHeight : Math.floor(scaledHeight);
};

const scale = screenWidth / guidelineBaseWidth;

const scaleFont = (size: number) => {
  const newSize = size * scale;
  if (isIOS) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

const scaleSizeWidth = (size: number) =>
  Math.floor((screenWidth / guidelineBaseWidth) * size);

const Mixins = {
  screenHeight,
  screenWidth,
  scaleSize,
  scaleFont,
  scaleSizeHeight,
  scaleSizeWidth,
};

export default Mixins;
