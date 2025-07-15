import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import Colors from '../../resource/theme/color';
import Mixins from '../../resource/mixins/appStyle';
import Fonts from '../../resource/theme/font';
import {isIOS, isValidUrl} from '../../helper/appUtils';
import ErrorComponent from '../../components/ErrorComponent';
import BannerAds from '../../components/Ads/BannerAds';
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
const PageWindow = ({navigation, route}: any) => {
  const inputRef = useRef(null);
  const [value, setValue] = useState<any>('');
  const [Customevalue, setCustomevalue] = useState<any>(0);
  const [windowScreen, setWindowScreen] = useState<number>(0);
  const [errorMessageRes, setErrorMessageRes] = useState<string>('');
  const [WindowSelectFlag, setWindowSelectFlag] = useState<any>(-1);
  const [modalVisible, setModalVisible] = useState(false);
  const [CustomeMinutes, setCustomeMinutes] = useState<number | any>(0);
  const data = route?.params?.item;
  const onFocusHandler = () => {
    if (Platform.OS === 'android') {
      console.log('inside onFocus');
    }
  };

  const onBlurHandler = () => {
    if (Platform.OS === 'android') {
      console.log('inside onBlur');
    }
  };

  const onChangeText = (value: any) => {
    console.log('onChangeText');
    setValue(value);
    isValidUrl(value);
    setErrorMessageRes('');
  };
  const DataButton = [
    {
      value: '5 Windows',
      number: 5,
    },
    {
      value: '10 Windows',
      number: 10,
    },
    {
      value: '25 Windows',
      number: 25,
    },
    {
      value: '50 Windows',
      number: 50,
    },
  ];

  // Reward ads
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
      },
    );
    // const unsubscribeEarned = rewarded.addAdEventListener(
    //   RewardedAdEventType.EARNED_REWARD,
    //   reward => {
    //     console.log('User earned reward of ', reward);
    //   },
    // );

    // Start loading the rewarded ad straight away
    rewarded.load();

    // Unsubscribe from events on unmount
    return () => {
      unsubscribeLoaded();
      // unsubscribeEarned();
    };
  }, []);

  // No advert ready to show yet
  // if (!loaded) {
  //   return null;
  // }

  return (
    <View style={styles.containe}>
      <ScrollView>
        <View style={{margin: scaleSize(10)}}>
          <View style={styles.subContainer}>
            <Text style={styles.textStyle}>Link*</Text>
            <TextInput
              value={value}
              placeholder="Enter link here"
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              placeholderTextColor={Colors.gray11()}
              ref={inputRef}
              onChangeText={onChangeText}
              style={styles.input}
            />
            <Text style={styles.textStyle}>Choose Any One*</Text>

            <View style={styles.buttonSubContainer}>
              {DataButton.map((item: any, index: number) => (
                <>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        backgroundColor:
                          WindowSelectFlag == index
                            ? Colors.green9()
                            : '#0B4960',
                        borderColor:
                          WindowSelectFlag == index
                            ? Colors.white()
                            : Colors.black(),
                      },
                    ]}
                    onPress={() => {
                      setErrorMessageRes('');
                      setWindowScreen(item.number);
                      setWindowSelectFlag(index);
                    }}>
                    <Text style={styles.buutonTextStyle}>{item.value}</Text>
                  </TouchableOpacity>
                </>
              ))}
            </View>

            <Text style={styles.textor}>or</Text>

            <View style={{marginVertical: scaleSize(10)}}>
              <TextInput
                value={Customevalue}
                placeholder="enter custome windows value"
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
                placeholderTextColor={Colors.gray11()}
                ref={inputRef}
                onChangeText={(value: any) => {
                  setCustomevalue(value);
                  setErrorMessageRes('');
                }}
                maxLength={3}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <TouchableOpacity
                style={styles.buttonClick}
                onPress={() => {
                  try {
                    console.log('CLICK');
                    if (windowScreen == 0 && Customevalue == 0) {
                      setErrorMessageRes(
                        'Please Select Window or please provide custome window number',
                      );
                      return;
                    } else if (value == '' || !isValidUrl(value)) {
                      setErrorMessageRes(
                        'Please add the Youtube or Instagram link!',
                      );
                      return;
                    }

                    if (data.flag == 'addMinutes') {
                      setModalVisible(true);
                    } else if (
                      value != '' &&
                      (windowScreen != 0 || Customevalue != 0)
                    ) {
                      rewarded.show();
                      navigation.navigate('WebViewWindow', {
                        item: data,
                        link: value,
                        windowScreen: windowScreen,
                        Customevalue: Customevalue,
                      });
                    }
                  } catch (error) {
                    navigation.navigate('WebViewWindow', {
                      item: data,
                      link: value,
                      windowScreen: windowScreen,
                      Customevalue: Customevalue,
                    });
                  }
                }}>
                <Text style={styles.buttonTextStyle}>Click</Text>
              </TouchableOpacity>
            </View>
          </View>
          {errorMessageRes != '' && (
            <ErrorComponent
              style={styles.errorStyle}
              message={errorMessageRes}
            />
          )}
          <TouchableWithoutFeedback
            onPress={() => {
              setModalVisible(!modalVisible);
            }}>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}>
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <Text style={styles.modeltext}>
                    After how Many seconds you want your video to Re play
                    automatically again
                  </Text>
                  <Text style={styles.modeltext}>
                    If your video is 5 minutes then you give 60x5=300 so you
                    want to play video you have to write
                  </Text>
                  <View style={{marginVertical: scaleSize(10)}}>
                    <Text style={[styles.modeltext, {textAlign: 'left'}]}>
                      Only Seconds*
                    </Text>
                    <TextInput
                      value={CustomeMinutes}
                      placeholder="Enter Seconds Here..."
                      placeholderTextColor={Colors.gray11()}
                      onFocus={onFocusHandler}
                      onBlur={onBlurHandler}
                      ref={inputRef}
                      onChangeText={value => {
                        setCustomeMinutes(value);
                      }}
                      maxLength={3}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.modelrowview}>
                    <TouchableOpacity
                      onPress={() => {
                        if (CustomeMinutes != 0) {
                          setModalVisible(!modalVisible);
                          navigation.navigate('WebViewWindow', {
                            item: data,
                            link: value,
                            windowScreen: windowScreen,
                            Customevalue: Customevalue,
                            CustomeMinutes: CustomeMinutes,
                          });
                        }
                      }}
                      style={styles.buttoncancel}>
                      <Text style={styles.canceltext}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </TouchableWithoutFeedback>
          <BannerAds />
        </View>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  containe: {
    flex: 1,
    backgroundColor: Colors.lightBlue(),
  },
  subContainer: {
    backgroundColor: Colors.white(),
    padding: scaleSize(30),
    borderRadius: scaleSize(10),
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray3(),
    marginVertical: scaleSize(10),
  },
  textStyle: {
    fontSize: scaleSize(18),
    fontFamily: Fonts.poppinsMediumItalic,
    color: Colors.black(),
    padding: scaleSize(5),
  },
  textor: {
    fontSize: scaleSize(16),
    fontFamily: Fonts.poppinsRegular,
    color: Colors.gray(),
    padding: scaleSize(5),
    textAlign: 'center',
  },
  buttonSubContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  button: {
    width: '40%',
    padding: scaleSize(10),
    backgroundColor: '#0B4960',
    alignItems: 'center',
    borderRadius: 5,
    margin: scaleSize(5),
    borderWidth: 1,
  },
  buutonTextStyle: {
    fontSize: scaleSize(16),
    fontFamily: Fonts.poppinsRegular,
    color: Colors.white(),
    padding: scaleSize(5),
    textAlign: 'center',
  },
  input: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: scaleFont(18),
    color: Colors.black(),
    borderColor: Colors.lightWhite(),
    borderWidth: 1,
    borderRadius: scaleSize(5),
    paddingHorizontal: isIOS ? scaleSize(0) : scaleSize(10),
  },
  buttonClick: {
    width: '50%',
    padding: scaleSize(10),
    backgroundColor: Colors.gradientTop(),
    alignItems: 'center',
    borderRadius: 5,
    marginVertical: scaleSize(15),
  },
  buttonTextStyle: {
    fontSize: 18,
    fontFamily: Fonts.poppinsBold,
    color: Colors.black(),
    padding: scaleSize(5),
  },
  errorStyle: {
    marginTop: scaleSize(10),
  },
  //Model Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,.7)',
  },
  modalView: {
    width: '95%',
    height: 300,
    marginHorizontal: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.white(),
    borderRadius: 5,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  modeltext: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.poppinsRegular,
    color: Colors.black(),
    lineHeight: scaleSize(30),
    textAlign: 'center',
  },
  buttoncancel: {
    height: scaleSize(40),
    width: scaleSize(120),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gradientTop(),
    borderRadius: 5,
  },

  canceltext: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.poppinsRegular,
    color: Colors.white(),
  },
});
export default PageWindow;
