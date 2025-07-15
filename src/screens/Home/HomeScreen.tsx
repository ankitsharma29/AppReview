import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {AppImages, BonusDisable} from '../../assets/constant';
import Fonts from '../../resource/theme/font';
import Colors from '../../resource/theme/color';
import Mixins from '../../resource/mixins/appStyle';
import {isIOS, openUrl, setCrashlaticsLog} from '../../helper/appUtils';
import {checkVersion} from 'react-native-check-version';
import DeviceInfo from 'react-native-device-info';
import BannerAds from '../../components/Ads/BannerAds';
import RewardAds from '../../components/Ads/RewardAds';
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-4293747280421578/6606751237';

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'clothing'],
});

const {scaleFont, scaleSize} = Mixins;
import analytics from '@react-native-firebase/analytics';
import database from '@react-native-firebase/database';
import messaging from '@react-native-firebase/messaging';

const HomeScreen = ({navigation}: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const HomeData = [
    {
      title: 'Get More Views In Multiple Tab',
      des: '*Your Video Must Be Longer Than one Minute',
      screen: 'PageWindow',
      flag: 'oneMinute',
    },
    {
      title: 'Get More Views In Multiple Tab',
      des: '',
      screen: 'PageWindow',
      flag: 'autoPlay',
    },
    {
      title: 'When The Video Ends, it Will Play Again Automatically',
      des: '',
      screen: 'PageWindow',
      flag: 'addMinutes',
    },
    {
      title: 'Learn more about these Apps',
      des: '',
      screen: 'PageWindow',
      flag: 'link',
    },
  ];

  const [RewardAdsShow, setRewardAdsShow] = useState<boolean>(false);
  const navigationScreen = (item: any) => {
    try {
      if (item.flag == 'link') {
        openUrl(
          'https://play.google.com/store/search?q=pub%3AAnkitMishra&c=apps&hl=en_IN&gl=US',
        );
      } else {
        // setRewardAdsShow(true);
        // rewarded.show();
        navigation.navigate('PageWindow', {item: item});
      }
      console.log('click');
    } catch (error) {
      // console.log("error",error.stack);
      navigation.navigate('PageWindow', {item: item});
      // console.log("error",error.message);
      setCrashlaticsLog(error);
    }
  };

  // Check App Update
  useEffect(() => {
    checkAppUpdate();
  }, []);

  const fcmTokenset = async () => {
    const fcmToken = await messaging().getToken();
    const newTodoRef = database().ref('/todos').push();
    newTodoRef.set({
      id: newTodoRef.key,
      text: fcmToken,
      completed: false,
    });
  };
  useEffect(() => {
    fcmTokenset();
  }, []);

  const checkAppUpdate = async () => {
    try {
      const version = await checkVersion();
      console.log('version', version);
      if (version.needsUpdate) {
        setModalVisible(true);
        console.log(`App has a ${version} update pending.`);
      }
    } catch (error) {
      console.log('App check error', error);
    }
  };

  // Reward ads
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
      },
    );
    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('User earned reward of ', reward);
      },
    );

    // Start loading the rewarded ad straight away
    rewarded.load();

    // Unsubscribe from events on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);

  // No advert ready to show yet
  // if (!loaded) {
  //   return null;
  // }

  useEffect(() => {
    const fireEvent = async () => {
      await analytics()
        .logEvent('Home', {
          screen: 'HomeSceen',
          type: 'OneMinute',
          purpose: 'View',
        })
        .then(res => {
          console.log('res', res);
        })
        .catch(err => {
          console.error('Error in payment_status');
        });
    };
    fireEvent();
  }, []);
  return (
    <View style={styles.containe}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={{margin: scaleSize(10)}}>
          {/* Banner Ad show */}
          <BannerAds />
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

          {/* Reward Ad show */}
          {/* <RewardAds VisibleReward={RewardAdsShow} /> */}
        </View>
      </ScrollView>
      {/* Banner Ad show */}
      <BannerAds />
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modeltext}>New version available!</Text>
            <Text style={styles.modelsubtext}>
              A new and improved version is available.
            </Text>
            <Text style={styles.modelsubtext}>
              Get the new version to access new features and content.
            </Text>
            <View style={styles.modelrowview}>
              <TouchableOpacity
                onPress={async () => {
                  if (isIOS) {
                    openUrl(
                      'https://play.google.com/store/apps/details?id=com.appgrowreview&hl=en_IN&gl=US',
                    );
                  } else {
                    openUrl(
                      'https://play.google.com/store/apps/details?id=com.appgrowreview&hl=en_IN&gl=US',
                    );
                  }
                }}
                style={styles.buttonUpdate}>
                <Text style={styles.Updatetext}>Update Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  containe: {
    flex: 1,
    backgroundColor: Colors.white(),
  },
  subContainer: {
    backgroundColor: Colors.orange1(),
    padding: scaleSize(30),
    borderRadius: scaleSize(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.black(),
    marginVertical: scaleSize(10),
  },
  textStyle: {
    fontSize: 18,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.black(),
    textAlign: 'center',
    padding: scaleSize(5),
  },
  button: {
    width: 100,
    padding: scaleSize(10),
    backgroundColor: Colors.gradientTop(),
    alignItems: 'center',
    borderRadius: 5,
  },
  // model
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,.5)',
  },
  modalView: {
    width: '100%',
    height: scaleSize(200),
    marginHorizontal: scaleSize(10),
    padding: scaleSize(10),
    paddingHorizontal: scaleSize(10),
    backgroundColor: Colors.white(),
    borderRadius: scaleSize(15),
    // alignItems: 'center',
    shadowColor: Colors.black(),
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modelrowview: {
    flexDirection: 'column',
    alignItems: 'center',
    // justifyContent: 'space-between',
    marginTop: scaleSize(10),
  },
  modeltext: {
    fontSize: scaleFont(23),
    fontFamily: Fonts.poppinsSemiBold,
    color: Colors.black(),
    lineHeight: scaleSize(30),
    textAlign: 'center',
  },
  modelsubtext: {
    fontSize: scaleFont(18),
    fontFamily: Fonts.poppinsRegular,
    color: Colors.black(),
    lineHeight: scaleSize(25),
    textAlign: 'center',
  },
  buttonUpdate: {
    height: scaleSize(50),
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.blue(),
    borderRadius: scaleSize(30),
  },
  Updatetext: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.poppinsMedium,
    color: Colors.white(),
  },
});
export default HomeScreen;
