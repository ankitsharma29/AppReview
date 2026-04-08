import {
  AppOpenAd,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';
import { isIOS } from '../../helper/appUtils';

export const interstitial = InterstitialAd.createForAdRequest(
  isIOS
    ? 'ca-app-pub-4293747280421578/5420962967'
    : 'ca-app-pub-4293747280421578/5420962967',
);

export const appOpenAd = AppOpenAd.createForAdRequest(TestIds.APP_OPEN, {
  requestNonPersonalizedAdsOnly: false,
  keywords: [
    'fashion',
    'clothing',
    'shopping',
    'lifestyle',
    'ecommerce',
    'trends',
    'retail',
    'accessories',
    'luxury',
    'apparel',
    'deals',
    'boutique',
    'style',
    'outfits',
    'designer',
  ],
});
