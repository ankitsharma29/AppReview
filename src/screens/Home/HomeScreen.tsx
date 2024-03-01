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
const {scaleFont, scaleSize} = Mixins;
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

  const navigationScreen = (item: any) => {
    try {
      if (item.flag == 'link') {
        openUrl(
          'https://play.google.com/store/search?q=pub%3AAnkitMishra&c=apps&hl=en_IN&gl=US',
        );
      } else {
        navigation.navigate('PageWindow', {item: item});
      }
      console.log('click');
    } catch (error) {
      // console.log("error",error.stack);
      // console.log("error",error.message);
      setCrashlaticsLog(error);
    }
  };

  // Check App Update
  useEffect(() => {
    checkAppUpdate();
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
  return (
    <View style={styles.containe}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
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
                      'https://play.google.com/store/apps/details?id=com.appreview&hl=en_IN&gl=US',
                    );
                  } else {
                    openUrl(
                      'https://play.google.com/store/apps/details?id=com.appreview&hl=en_IN&gl=US',
                    );
                  }
                }}
                style={styles.buttonUpdate}>
                <Text style={styles.Updatetext}>UPdate Now</Text>
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
