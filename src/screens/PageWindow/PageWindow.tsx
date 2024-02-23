import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import React, {useRef, useState} from 'react';
import Colors from '../../resource/theme/color';
import Mixins from '../../resource/mixins/appStyle';
import Fonts from '../../resource/theme/font';
import {isIOS, isValidUrl} from '../../helper/appUtils';
const {scaleFont, scaleSize} = Mixins;
const PageWindow = ({navigation}: any) => {
  const inputRef = useRef(null);
  const [value, setValue] = useState<any>('');
  const [Customevalue, setCustomevalue] = useState<any>(0);
  const [windowScreen, setWindowScreen] = useState<number>(0);
  const onFocusHandler = () => {
    if (Platform.OS === 'android') {
      console.log('inside onFocus');
    }
  };
  console.log('windowScreen', Customevalue);

  const onBlurHandler = () => {
    if (Platform.OS === 'android') {
      console.log('inside onBlur');
    }
  };

  const onChangeText = (value: any) => {
    console.log('onChangeText');
    setValue(value);
    isValidUrl(value);
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
              ref={inputRef}
              onChangeText={onChangeText}
              style={styles.input}
            />
            <Text style={styles.textStyle}>Choose Any One*</Text>

            <View style={styles.buttonSubContainer}>
              {DataButton.map((item: any) => (
                <>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      setWindowScreen(item.number);
                    }}>
                    <Text style={styles.buutonTextStyle}>{item.value}</Text>
                  </TouchableOpacity>
                </>
              ))}
            </View>

            <View style={{marginVertical: scaleSize(10)}}>
              <TextInput
                value={Customevalue}
                placeholder="enter custome windows value"
                onFocus={onFocusHandler}
                onBlur={onBlurHandler}
                ref={inputRef}
                onChangeText={setCustomevalue}
                maxLength={3}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <TouchableOpacity
                style={styles.buttonClick}
                onPress={() => {
                  console.log('CLICK');
                  navigation.navigate('WebViewWindow');
                }}>
                <Text style={styles.buttonTextStyle}>Click</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    fontSize: 18,
    fontFamily: Fonts.poppinsMediumItalic,
    color: Colors.black(),
    padding: scaleSize(5),
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
  },
  buutonTextStyle: {
    fontSize: scaleSize(16),
    fontFamily: Fonts.poppinsRegular,
    color: Colors.white(),
    padding: scaleSize(5),
    textAlign: 'center',
  },
  input: {
    flex: 1,
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
    backgroundColor: Colors.blue6(),
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
});
export default PageWindow;
