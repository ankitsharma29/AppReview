import {View, Text} from 'react-native';
import React from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';

const BannerAds = ({adUnitId, BaneerSize}: any) => {
  const adUnitId1 = __DEV__
    ? TestIds.BANNER
    : adUnitId ?? 'ca-app-pub-4293747280421578/4003804476';
  return (
    <BannerAd
      unitId={adUnitId1}
      // size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      size={BaneerSize ?? '390x180'}
      onAdFailedToLoad={value => {
        console.log('value', value);
      }}
      addStatusUpdateListener={true}
      requestOptions={{
        requestPersonalizedAdsOnly: true,
      }}
      onAdLoaded={value => {
        console.log('onAdLoaded', value);
      }}
      onAdOpened={(value: any) => {
        console.log('onAdOpened', value);
      }}
    />
  );
};

export default BannerAds;
