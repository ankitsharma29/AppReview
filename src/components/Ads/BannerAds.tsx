import React, { useState } from 'react';
import { View } from 'react-native';
import { TestIds, BannerAd } from 'react-native-google-mobile-ads';
import { useIsFocused } from '@react-navigation/native';

const BannerAds = ({ adUnitId, BaneerSize }: any) => {
  const isFocused = useIsFocused();
  const [adLoaded, setAdLoaded] = useState(false); // ✅ Default hidden

  const adUnitId1 = __DEV__
    ? TestIds.BANNER
    : adUnitId ?? 'ca-app-pub-4293747280421578/4003804476';

  if (!isFocused) return null;

  return (
    // ✅ Ad load nahi hua toh height 0 — koi space nahi
    <View style={{ height: adLoaded ? undefined : 0, overflow: 'hidden' }}>
      <BannerAd
        key={`banner-${isFocused}`}
        unitId={adUnitId1}
        size={BaneerSize ?? '390x180'}
        onAdLoaded={() => {
          setAdLoaded(true);  // ✅ Ad aaya — space show karo
        }}
        onAdFailedToLoad={value => {
          setAdLoaded(false); // ✅ Ad fail — space hatao
          console.log('Ad Failed:', value);
        }}
        // requestOptions={{
        //   requestPersonalizedAdsOnly: true,
        // }}
        onAdOpened={(value: any) => {
          console.log('onAdOpened', value);
        }}
      />
    </View>
  );
};

export default BannerAds;