
import { Dimensions } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

export const s = (size: number) => scale(size);
export const vs = (size: number) => verticalScale(size);
export const ms = (size: number, factor = 0.5) => moderateScale(size, factor);

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const { width, height } = Dimensions.get('window');
const shortSide = Math.min(width, height);

export const isSmallDevice = shortSide < 360;
export const isTablet = shortSide >= 600;

/** Caps how far the phone's accessibility font size can enlarge text. */
export const MAX_FONT_SCALE = 1.2;