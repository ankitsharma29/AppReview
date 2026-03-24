import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { trackScreenView } from '../../helper/ScreenTracking';
import { AppImages } from '../../assets/constant';
import { screenWidth } from '../../helper/appUtils';
import Mixins from '../../resource/mixins/appStyle';
import { customWebTab } from '../../components/customWebTab';
import FastImage from 'react-native-fast-image';
import { interstitial } from '../../components/Ads/adMethods';
const { scaleFont, scaleSize } = Mixins;
const PromoBanner = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const checkExpiry = () => {
      const now = new Date();

      // Set expiry date (30 March 2026, 23:59:59)
      const expiryDate = new Date('2026-03-30T23:59:59');

      if (now > expiryDate) {
        setVisible(false);
      }
    };

    checkExpiry();

    // Optional: check every hour
    const interval = setInterval(checkExpiry, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;
  useEffect(() => {
    interstitial.load();
  }, []);
  return (
    <TouchableOpacity
      onPress={async () => {
        try {
          await interstitial.show();
          await trackScreenView('BrandPermotion', 'AppReview');
          customWebTab('https://cracknaukri.com/BrandPromotionForm').then(
            res => {
              console.log('res', res);
            },
          );
        } catch (error) {
          await trackScreenView('BrandPermotion', 'AppReview');
          customWebTab('https://cracknaukri.com/BrandPromotionForm').then(
            res => {
              console.log('res', res);
            },
          );
        }
      }}
      style={{
        // marginVertical: scaleSize(5),
        borderRadius: scaleSize(12),
      }}
    >
      <FastImage
        source={AppImages.freeBrandBanner}
        style={{
          height: scaleSize(300),
          width: screenWidth - 22,
          borderRadius: scaleSize(12),
        }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default PromoBanner;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff3b3b',
    padding: 15,
    borderRadius: 12,
    margin: 10,
    elevation: 5,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subTitle: {
    color: '#ffd700',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  highlight: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5,
  },
  desc: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  limited: {
    color: '#ffe600',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#000',
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
