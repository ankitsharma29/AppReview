import React, {useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import WebViewPage from '../../components/WebViewPage';
import Mixins from '../../resource/mixins/appStyle';
import Colors from '../../resource/theme/color';
import WebView from 'react-native-webview';
import CommonLoader from '../../components/CommonLoader';
import Fonts from '../../resource/theme/font';
import {isIOS} from '../../helper/appUtils';
const {scaleFont, scaleSize} = Mixins;
const WebViewWindow = ({navigation, route}: any) => {
  const inputRef = useRef(null);
  const data = route?.params?.item;
  const UrlWeb = route?.params?.link;
  const Customevalue = route?.params?.Customevalue;
  const windowScreen = route?.params?.windowScreen;
  const [modalVisible, setModalVisible] = useState(
    data.flag == 'addMinutes' && true,
  );
  const [CustomeMinutes, setCustomeMinutes] = useState<any>(0);

  const [webData, setwebData] = useState<any>([]);
  useEffect(() => {
    for (let value = 0; value < Customevalue; value++) {
      setwebData((prevState: any) => [
        ...prevState,
        {
          url: UrlWeb,
          id: value,
        },
      ]);
    }
  }, []);
  console.log('webData', webData);

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
  return (
    <View style={{flex: 1, backgroundColor: Colors.white()}}>
      <ScrollView>
        {(data.flag == 'oneMinute' || data.flag == 'addMinutes') && (
          <View
            style={{
              justifyContent: 'space-evenly',
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              margin: scaleSize(10),
            }}>
            <View style={[styles.TopView, {flex: 0.2}]}>
              <Text style={styles.textStyle}>60</Text>
            </View>
            <View style={[styles.TopView, {flex: 0.6}]}>
              <Text style={styles.textStyleLine}>
                {data.flag == 'addMinutes'
                  ? ' Your Custome time complete after auto refresh'
                  : 'Your Video Must Be Longer Than One Minute'}
              </Text>
            </View>
            <View style={[styles.TopView, {flex: 0.4}]}>
              <Text style={styles.textStyle}>View: 10</Text>
            </View>
          </View>
        )}

        <View
          style={{
            flexWrap: 'wrap',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {webData.length != 0 &&
            webData.map((item: any) => (
              <>
                <WebViewPage Requesturl={item.url} />
              </>
            ))}
        </View>
        <TouchableWithoutFeedback
          onPress={() => {
            setModalVisible(!modalVisible);
          }}>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(!modalVisible);
            }}>
            <TouchableOpacity
              style={styles.centeredView}
              activeOpacity={1}
              onPressOut={() => {
                setModalVisible(!modalVisible);
              }}>
              <View>
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
                      placeholderTextColor={Colors.gray()}
                      onFocus={onFocusHandler}
                      onBlur={onBlurHandler}
                      ref={inputRef}
                      onChangeText={setCustomeMinutes}
                      maxLength={3}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.modelrowview}>
                    <TouchableOpacity
                      onPress={() => {
                        setModalVisible(!modalVisible);
                      }}
                      style={styles.buttoncancel}>
                      <Text style={styles.canceltext}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

export default WebViewWindow;

const styles = StyleSheet.create({
  subContainer: {
    borderRadius: scaleSize(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray3(),
    margin: scaleSize(10),
    width: '40%',
    height: '25%',
  },
  TopView: {
    borderRadius: scaleSize(5),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.gray3(),
    padding: scaleSize(10),
    marginHorizontal: scaleSize(2),
    backgroundColor: Colors.blue5(),
  },
  textStyle: {
    color: Colors.black(),
    fontSize: scaleSize(18),
    fontFamily: Fonts.poppinsBold,
  },
  textStyleLine: {
    color: Colors.blue(),
    fontSize: scaleSize(11),
    fontFamily: Fonts.poppinsSemiBold,
    textAlign: 'center',
  },
  input: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: scaleFont(16),
    color: Colors.black(),
    borderColor: Colors.lightWhite2(),
    borderWidth: 1,
    borderRadius: scaleSize(5),
    paddingHorizontal: isIOS ? scaleSize(0) : scaleSize(10),
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
