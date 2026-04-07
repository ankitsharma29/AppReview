import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { ArrowBack, History } from '../assets/constant';
import Colors from '../resource/theme/color';
import Mixins from '../resource/mixins/appStyle';
import Fonts from '../resource/theme/font';

const { scaleSize, scaleFont } = Mixins;
const Header = ({
  navigation,
  title,
  skipshow = false,
  headerSubTitle,
  desc,
  skipPress,
  backgroundColor = '',
  backButton = true,
  historyButton = true,
}: any) => {
  return (
    <>
      {skipshow == true ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: Colors.HeaderColor(),
            borderBottomLeftRadius: scaleSize(25),
            borderBottomRightRadius: scaleSize(25),
          }}
        >
          <View style={styles.headerMain}>
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
              }}
            >
              <ArrowBack fill={Colors.black()} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={skipPress}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: scaleSize(30) }}>
            <Text style={styles.title}>{headerSubTitle}</Text>
            <Text style={styles.subText}>{desc}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.header]}>
          <>
            {backButton == true ? (
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <ArrowBack fill={Colors.black()} />
              </TouchableOpacity>
            ) : (
              <Text></Text>
            )}

            <Text style={styles.headerText}>{title}</Text>
            {historyButton == true ? (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('HistoryScreen');
                }}
              >
                <History fill={Colors.white()} />
              </TouchableOpacity>
            ) : (
              <Text></Text>
            )}
          </>
        </View>
      )}
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    backgroundColor: Colors.gradientTop(),
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    padding: scaleSize(10),
  },
  headerText: {
    color: Colors.white(),
    fontSize: scaleFont(24),
    fontWeight: '400',
    fontFamily: Fonts.poppinsRegular,
  },
  skipButton: {
    padding: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  skipText: {
    fontSize: 14,
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    fontFamily: Fonts.poppinsBold,
    color: Colors.black(),
  },
  subText: {
    fontSize: scaleFont(18),
    color: Colors.black(),
    fontFamily: Fonts.poppinsRegular,
    marginTop: scaleSize(15),
  },
});
