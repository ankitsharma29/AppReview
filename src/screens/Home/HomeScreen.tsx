import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {AppImages, BonusDisable} from '../../assets/constant';
import Fonts from '../../resource/theme/font';
import Colors from '../../resource/theme/color';
import Mixins from '../../resource/mixins/appStyle';
import {openUrl} from '../../helper/appUtils';
const {scaleFont, scaleSize} = Mixins;
const HomeScreen = ({navigation}: any) => {
  const HomeData = [
    {
      title: 'Get More Views In Multiple Tab',
      des: '*Your Video Must Be Longer Than one Minute',
      screen: 'PageWindow',
      flag: 'onMinute',
    },
    {
      title: 'Get More Views In Multiple Tab',
      des: '',
      screen: 'PageWindow',
      flag: 'onMinute',
    },
    {
      title: 'When The Video Ends, it Will Play Again Automatically',
      des: '',
      screen: 'PageWindow',
      flag: 'onMinute',
    },
    {
      title: 'Learn more about these Apps',
      des: '',
      screen: 'PageWindow',
      flag: 'link',
    },
  ];

  const navigationScreen = (item: any) => {
    if (item.flag == 'link') {
      openUrl(
        'https://play.google.com/store/search?q=pub%3AAnkitMishra&c=apps&hl=en_IN&gl=US',
      );
    } else {
      navigation.navigate('PageWindow');
    }
    console.log('click');
  };
  return (
    <View style={styles.containe}>
      <ScrollView>
        <View style={{margin: scaleSize(10)}}>
          {HomeData.map((item: any, index: number) => (
            <>
              <View style={styles.subContainer}>
                <Text style={styles.textStyle}>{item.title}</Text>
                {item.des != '' && (
                  <Text style={styles.textStyle}>{item.des}</Text>
                )}
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    navigationScreen(item);
                  }}>
                  <Text style={styles.textStyle}>View{' >'} </Text>
                </TouchableOpacity>
              </View>
            </>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  containe: {
    flex: 1,
    backgroundColor: Colors.white(),
  },
  subContainer: {
    backgroundColor: Colors.blue5(),
    padding: scaleSize(30),
    borderRadius: scaleSize(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray3(),
    marginVertical: scaleSize(10),
  },
  textStyle: {
    fontSize: 18,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.gray(),
    textAlign: 'center',
    padding: scaleSize(5),
  },
  button: {
    width: 100,
    padding: scaleSize(10),
    backgroundColor: Colors.white(),
    alignItems: 'center',
    borderRadius: 5,
  },
});
export default HomeScreen;
