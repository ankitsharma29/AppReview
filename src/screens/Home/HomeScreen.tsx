import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Pressable,
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { AppImages, BonusDisable } from '../../assets/constant';
import Fonts from '../../resource/theme/font';
import Colors from '../../resource/theme/color';
import Mixins from '../../resource/mixins/appStyle';
import {
  getDeviceId,
  isIOS,
  isValidUrl,
  openUrl,
  screenWidth,
  setCrashlaticsLog,
} from '../../helper/appUtils';
import { checkVersion } from 'react-native-check-version';
import DeviceInfo from 'react-native-device-info';
import BannerAds from '../../components/Ads/BannerAds';
import RewardAds from '../../components/Ads/RewardAds';
import DownLoadVideo from '../../components/DownLoadVideo';
import {
  BannerAdSize,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AppOpenAd,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-4293747280421578/6606751237';

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'clothing'],
});
const adAppOpenId = __DEV__
  ? TestIds.APP_OPEN
  : 'ca-app-pub-4293747280421578/7561318171';

const appOpenAd = AppOpenAd.createForAdRequest(adAppOpenId, {
  keywords: ['fashion', 'clothing'],
});

const { scaleFont, scaleSize } = Mixins;
import analytics from '@react-native-firebase/analytics';
import database from '@react-native-firebase/database';
import messaging from '@react-native-firebase/messaging';
import { useIsFocused } from '@react-navigation/native';
import ImageLabelSectionTitleFlatView from '../../components/ImageLabelSectionTitleFlatView';
import { customWebTab } from '../../components/customWebTab';
import FastImage from 'react-native-fast-image';
import { interstitial } from '../../components/Ads/adMethods';
import { trackScreenView } from '../../helper/ScreenTracking';
import PromoBanner from '../PromoBanner/PromoBanner';
import ViewAllSection from '../../components/ViewAllSection';
import SnapCarousel from '../../components/SnapCarousel';
import Header from '../../components/Header';

const HomeScreen = ({ navigation }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const isFocused = useIsFocused();
  const HomeData = [
    {
      title: 'Get More Views In Multiple Tab',
      des: '*Your Video Must Be Longer Than one Minute',
      screen: 'PageWindow',
      flag: 'oneMinute',
    },
    {
      title: 'History Shorts',
      des: 'View all your saved URLs in one place. Open any link instantly in full-screen WebView and scroll through your browsing history easily.',
      screen: 'Shorts',
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
  useEffect(() => {
    interstitial.load();
  }, [isFocused]);
  const [RewardAdsShow, setRewardAdsShow] = useState<boolean>(false);
  const navigationScreen = (item: any) => {
    try {
      // Show the app open ad when user brings the app to the foreground.
      appOpenAd.show();
      if (item.flag == 'link') {
        openUrl(
          'https://play.google.com/store/apps/dev?id=6984237370327765283&hl=en_IN&gl=US',
        );
      } else {
        // setRewardAdsShow(true);
        // rewarded.show();
        navigation.navigate(item?.screen, { item: item });
      }
      console.log('click');
    } catch (error) {
      // console.log("error",error.stack);
      navigation.navigate('PageWindow', { item: item });
      // console.log("error",error.message);
      setCrashlaticsLog(error);
    }
  };

  // load ads
  useEffect(() => {
    // Preload an app open ad
    appOpenAd.load();
  }, [isFocused]);

  // Check App Update
  useEffect(() => {
    // Preload an app open ad
    checkAppUpdate();
  }, []);

  const fcmTokenset = async () => {
    const fcmToken = await messaging().getToken();
    const newTodoRef = database().ref('/AppGrowtodos').push();
    newTodoRef.set({
      id: newTodoRef.key,
      text: fcmToken,
      completed: false,
    });
  };
  useEffect(() => {
    fetchGameData();
    // fcmTokenset();
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

  // useEffect(() => {
  //   const unsubscribeLoaded = rewarded.addAdEventListener(
  //     RewardedAdEventType.LOADED,
  //     () => {
  //       setLoaded(true);
  //     },
  //   );
  //   const unsubscribeEarned = rewarded.addAdEventListener(
  //     RewardedAdEventType.EARNED_REWARD,
  //     reward => {
  //       console.log('User earned reward of ', reward);
  //     },
  //   );

  //   // Start loading the rewarded ad straight away
  //   rewarded.load();

  //   // Unsubscribe from events on unmount
  //   return () => {
  //     unsubscribeLoaded();
  //     unsubscribeEarned();
  //   };
  // }, []);

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
  // fetch game list data
  const [GameList, setGameList] = useState<any>({});
  const [AdsListData, setAdsListData] = useState<any>({
    title: 'Brand Promotion',
    data: [],
    showViewAll: 'viewall',
    viewAllUrl: 'viewall',
  });
  const [downloadUrl, setDownloadUrl] = useState<any>({
    title: 'Game Section',
    data: [{}],
    showViewAll: 'viewall',
    viewAllUrl: 'viewall',
  });
  const fetchGameData = async () => {
    try {
      fetch('https://api.gamezop.com/v3/games', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ff1ad137-8cc5-4b41-a277-0fd61a284f74',
        },
      })
        .then(res => res.json())
        .then(response => {
          console.log('response', response);

          setGameList({
            title: 'Game Section',
            data: response?.data?.slice(11, 15),
            showViewAll: 'viewall',
            viewAllUrl: 'viewall',
          });
        });
    } catch (error) {
      // console.log('error');
    }
  };
  const onItemPress = async () => {
    await interstitial.show();
    navigation.navigate('GameList');
  };
  const onItemAdsPress = async () => {
    await interstitial.show();
    navigation.navigate('AdsList');
  };
  const onItemAdsPressV = async (item: any) => {
    Linking.openURL(item?.channelUrl);
  };

  const onGameItemPress = async (item: any) => {
    const userId = await getDeviceId();
    customWebTab(`${item.url}?sub=${userId}`).then(res => {
      console.log('res', res);
    });
    appOpenAd.show();
  };
  const ImageRenderCard = useCallback(({ item }: any) => {
    return (
      <>
        <Pressable
          onPress={() => {
            Linking.openURL(item?.channelUrl);
          }}
          style={[
            {
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: scaleSize(12),
            },
          ]}
        >
          <Image
            source={
              isValidUrl(item?.image)
                ? {
                    uri: isValidUrl(item?.image)
                      ? item?.image
                      : 'data:image/png;base64,' + item?.image,
                  }
                : item?.image
            }
            style={styles.otherCards}
            resizeMode="cover"
          />
        </Pressable>
      </>
    );
  }, []);

  const imageCrousal = [
    {
      image: AppImages.freeBrandBanner,
      channelUrl: '',
    },
    {
      image: AppImages.freeBrandBanner,
      channelUrl: '',
    },
  ];
  return (
    <View style={styles.containe}>
      <Header
        title={'View & Watch Time Browser'}
        navigation={navigation}
        backButton={false}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ margin: scaleSize(10) }}>
          {/* <TouchableOpacity
            onPress={async () => {
              await trackScreenView('CrackNaukriHome', 'AppReview');
              Linking.openURL('https://cracknaukri.com/');
            }}
            style={{ marginVertical: scaleSize(10) }}
          >
            <FastImage
              source={AppImages.CrackNaukri}
              style={styles.otherCards}
              resizeMode="cover"
            />
          </TouchableOpacity> */}
          {/* <PromoBanner /> */}
          {/* <TouchableOpacity
            onPress={async () => {
              await trackScreenView('CrackNaukriStateBanner', 'AppReview');

              customWebTab('https://cracknaukri.com/').then(res => {
                console.log('res', res);
              });
            }}
            style={{ marginBottom: scaleSize(10) }}
          >
            <FastImage
              source={AppImages.stateJobs}
              style={styles.otherCardsNormal}
              resizeMode="cover"
            />
          </TouchableOpacity> */}

          {/* brand permotion */}

          {/* <ViewAllSection
            title={'Brand Permotion'}
            showViewAll={'showViewAll'}
            onViewAllPress={async () => {
              await interstitial.show();
              navigation.navigate('AdsList');
            }}
          /> */}
          <View style={{ marginVertical: scaleSize(10) }} />
          {/* <SnapCarousel
            data={imageCrousal}
            renderItem={({ item }) => <ImageRenderCard item={item} />}
            sliderWidth={screenWidth - 22}
            itemWidth={screenWidth - 22}
            autoplayInterval={5000}
            dotStyle={styles.dotStyle}
            inactiveDotStyle={styles.inactiveDotStyle}
            inactiveDotScale={1}
            needPagination={false}
            autoplay={true}
            // scrollEnabled={false}
          /> */}
          {/* {AdsListData?.data?.length > 0 && (
            <ImageLabelSectionTitleFlatView
              widget={AdsListData}
              style={styles.menu}
              onItemPress={onItemAdsPressV}
              onViewAllPress={() =>
                !!AdsListData.viewAllUrl && onItemAdsPress()
              }
            />
          )} */}

          {/* download videos */}
          {/* {downloadUrl?.data?.length > 0 && (
            <ImageLabelSectionTitleFlatView
              widget={downloadUrl}
              style={styles.menu}
              onItemPress={onGameItemPress}
              onViewAllPress={() => !!GameList.viewAllUrl && onItemPress()}
            />
          )} */}
          {/* <DownLoadVideo /> */}
          {/* Banner Ad show */}
          <BannerAds
            BaneerSize="390x170"
            adUnitId={'ca-app-pub-4293747280421578/5005960189'}
          />
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
                  }}
                >
                  <Text style={styles.textStyle}>Click</Text>
                </TouchableOpacity>
              </View>
            </>
          ))}

          {/* Reward Ad show */}
          {/* <RewardAds VisibleReward={RewardAdsShow} /> */}
          {/* Game List */}
          {GameList?.data?.length > 0 && (
            <ImageLabelSectionTitleFlatView
              widget={GameList}
              style={styles.menu}
              onItemPress={onGameItemPress}
              onViewAllPress={() => !!GameList.viewAllUrl && onItemPress()}
            />
          )}
          {/* Banner Ad show */}
          {/* <BannerAds adUnitId={'ca-app-pub-4293747280421578/5005960189'} /> */}
        </View>
      </ScrollView>
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
                style={styles.buttonUpdate}
              >
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
    backgroundColor: Colors.gradientTop(),
    padding: scaleSize(20),
    borderRadius: scaleSize(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.black(),
    marginVertical: scaleSize(10),
  },
  otherCards: {
    height: screenWidth * (0.85 * 0.45),
    width: screenWidth - 22,
    borderRadius: scaleSize(12),
  },
  otherCardsNormal: {
    height: screenWidth * (0.85 * 0.5),
    width: screenWidth - 22,
    borderRadius: scaleSize(12),
  },
  menu: {
    paddingVertical: scaleSize(15),
    marginVertical: scaleSize(8),
  },
  textStyle: {
    fontSize: 18,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.white(),
    fontWeight: '400',
    textAlign: 'center',
    padding: scaleSize(5),
  },
  button: {
    width: 100,
    padding: scaleSize(10),
    backgroundColor: Colors.black(),
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
  dotStyle: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(6),
    backgroundColor: Colors.white(),
  },
  inactiveDotStyle: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(6),
    backgroundColor: Colors.ButtonBgColor(),
  },
});
export default HomeScreen;
