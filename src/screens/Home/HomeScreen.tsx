import {View, Text, Image} from 'react-native';
import React from 'react';
import {AppImages, BonusDisable} from '../../assets/constant';
import Fonts from '../../resource/theme/font';
const HomeScreen = () => {
  return (
    <View>
      <Text style={{fontSize: 20, fontFamily:Fonts.poppinsRegular}}>HomeScreen</Text>
      <BonusDisable />
      <Image source={AppImages.MyName} />
    </View>
  );
};

export default HomeScreen;
