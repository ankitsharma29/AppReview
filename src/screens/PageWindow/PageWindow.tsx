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
  Linking,
  Animated,
  StatusBar,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import Colors from '../../resource/theme/color';
import Mixins from '../../resource/mixins/appStyle';
import Fonts from '../../resource/theme/font';
import { isIOS, isValidUrl, screenWidth } from '../../helper/appUtils';
import ErrorComponent from '../../components/ErrorComponent';
import BannerAds from '../../components/Ads/BannerAds';
import { RewardedAd, TestIds } from 'react-native-google-mobile-ads';
import { interstitial } from '../../components/Ads/adMethods';
import { useIsFocused } from '@react-navigation/native';
import { AppImages } from '../../assets/constant';
import Header from '../../components/Header';
import AsyncStorageServices from '../../helper/asyncStorageServices';
import { addShortsUrl } from '../../firebase/firebaseService';
import Checkbox from '../../components/Checkbox';

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-4293747280421578/6606751237';

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'clothing'],
});

const { scaleFont, scaleSize } = Mixins;

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const D = {
  bg: '#09090F',
  surface: '#101019',
  card: '#13131F',
  border: '#252538',
  accent: '#7C6AF7',
  pink: '#F76A8A',
  teal: '#6AF7C8',
  text: '#F0EEFF',
  muted: '#6B6880',
  error: '#F87171',
  white: '#FFFFFF',
  inputBg: '#0E0E1A',
};

// ─────────────────────────────────────────────
// Window count selector button
// ─────────────────────────────────────────────
function WindowBtn({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 280,
      friction: 10,
    }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 280,
      friction: 10,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], width: '47%' }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={[styles.windowBtn, selected && styles.windowBtnActive]}
      >
        {selected && <View style={styles.windowBtnDot} />}
        <Text
          style={[styles.windowBtnTxt, selected && styles.windowBtnTxtActive]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main PageWindow — ALL original logic preserved
// ─────────────────────────────────────────────
const PageWindow = ({ navigation, route }: any) => {
  const inputRef = useRef(null);
  const [value, setValue] = useState<any>('');
  const [Customevalue, setCustomevalue] = useState<any>(0);
  const [windowScreen, setWindowScreen] = useState<number>(0);
  const [errorMessageRes, setErrorMessageRes] = useState<string>('');
  const [WindowSelectFlag, setWindowSelectFlag] = useState<any>(-1);
  const [modalVisible, setModalVisible] = useState(false);
  const [CustomeMinutes, setCustomeMinutes] = useState<number | any>(0);
  const [checked, setChecked] = useState({ terms: false, newsletter: false });
  const [loaded, setLoaded] = useState(false);

  const data = route?.params?.item;
  const isFocused = useIsFocused();

  // ── original logic (unchanged) ─────────────
  useEffect(() => {
    interstitial.load();
  }, [isFocused]);

  useEffect(() => {
    if (isFocused === false) {
      (async () => {
        await interstitial.show();
      })();
    }
  }, [isFocused]);

  const onFocusHandler = () => {
    if (Platform.OS === 'android') console.log('inside onFocus');
  };
  const onBlurHandler = () => {
    if (Platform.OS === 'android') console.log('inside onBlur');
  };
  const onChangeText = (val: any) => {
    setValue(val);
    isValidUrl(val);
    setErrorMessageRes('');
  };

  const DataButton = [
    { value: '5 Windows', number: 5 },
    { value: '10 Windows', number: 10 },
    { value: '25 Windows', number: 25 },
    { value: '50 Windows', number: 50 },
  ];

  const saveHistory = async (url: string) => {
    let data = await AsyncStorageServices.getItem('urlHistory');
    let history = data ? JSON.parse(data) : [];
    history.unshift(url);
    await AsyncStorageServices.setItem('urlHistory', JSON.stringify(history));
  };

  const handleClick = async () => {
    saveHistory(value);
    if (checked.terms) {
      const trimmed = value.trim();
      addShortsUrl(trimmed);
    }
    try {
      if (windowScreen === 0 && Customevalue === 0) {
        setErrorMessageRes(
          'Please Select Window or provide custom window number',
        );
        return;
      } else if (value === '' || !isValidUrl(value)) {
        setErrorMessageRes('Please add the Youtube or Instagram link!');
        return;
      }
      if (data.flag === 'addMinutes') {
        setModalVisible(true);
      } else if (value !== '' && (windowScreen !== 0 || Customevalue !== 0)) {
        navigation.navigate('WebViewWindow', {
          item: data,
          link: value,
          windowScreen,
          Customevalue,
        });
      }
    } catch (error) {
      navigation.navigate('WebViewWindow', {
        item: data,
        link: value,
        windowScreen,
        Customevalue,
      });
    }
  };
  // ── end original logic ──────────────────────

  // header entrance
  const hdrFade = useRef(new Animated.Value(0)).current;
  const hdrY = useRef(new Animated.Value(-16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(hdrFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(hdrY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.containe}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />

      {/* original Header component — unchanged */}
      <Header title={'Browser Screen'} navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero info banner ── */}
        <Animated.View
          style={[
            styles.heroBanner,
            { opacity: hdrFade, transform: [{ translateY: hdrY }] },
          ]}
        >
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroEmoji}>🌐</Text>
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Multi-Window Browser</Text>
            <Text style={styles.heroSub}>
              Open your link in multiple tabs simultaneously to boost views
            </Text>
          </View>
        </Animated.View>

        {/* ── Main form card ── */}
        <View style={styles.subContainer}>
          {/* URL input section */}
          <View style={styles.sectionLabel}>
            <View style={styles.labelDot} />
            <Text style={styles.textStyle}>Video / Page Link</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredTxt}>Required</Text>
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔗</Text>
            <TextInput
              value={value}
              placeholder="Paste YouTube or Instagram link..."
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              placeholderTextColor={D.muted}
              ref={inputRef}
              onChangeText={onChangeText}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Window count label */}
          <View style={[styles.sectionLabel, { marginTop: scaleSize(20) }]}>
            <View style={[styles.labelDot, { backgroundColor: D.teal }]} />
            <Text style={styles.textStyle}>Choose Window Count</Text>
            <View
              style={[
                styles.requiredBadge,
                {
                  backgroundColor: 'rgba(106,247,200,0.12)',
                  borderColor: 'rgba(106,247,200,0.3)',
                },
              ]}
            >
              <Text style={[styles.requiredTxt, { color: D.teal }]}>
                Pick One
              </Text>
            </View>
          </View>

          {/* Window buttons grid */}
          <View style={styles.buttonSubContainer}>
            {DataButton.map((item: any, index: number) => (
              <WindowBtn
                key={index}
                label={item.value}
                selected={WindowSelectFlag === index}
                onPress={() => {
                  setErrorMessageRes('');
                  setWindowScreen(item.number);
                  setWindowSelectFlag(index);
                }}
              />
            ))}
          </View>

          {/* OR divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.textor}>or custom</Text>
            <View style={styles.orLine} />
          </View>

          {/* Custom window input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔢</Text>
            <TextInput
              value={Customevalue}
              placeholder="Enter custom window count..."
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              placeholderTextColor={D.muted}
              ref={inputRef}
              onChangeText={(val: any) => {
                setCustomevalue(val);
                setErrorMessageRes('');
              }}
              maxLength={3}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>

          {/* Checkbox */}
          <View style={styles.checkboxRow}>
            <Checkbox
              checked={checked.terms}
              onChange={val => setChecked(prev => ({ ...prev, terms: val }))}
              label="Add URL to shorts feed"
            />
          </View>

          {/* Error */}
          {errorMessageRes !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTxt}>{errorMessageRes}</Text>
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={styles.buttonClick}
            onPress={handleClick}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonTextStyle}>🚀 Open Browser Windows</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Ad — original unchanged */}
        <BannerAds adUnitId={'ca-app-pub-4293747280421578/6961862070'} />
      </ScrollView>

      {/* ── Minutes Modal — original logic, redesigned UI ── */}
      <TouchableWithoutFeedback onPress={() => setModalVisible(!modalVisible)}>
        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <View style={styles.centeredView}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalView}>
                {/* handle */}
                <View style={styles.modalHandle} />

                {/* icon */}
                <View style={styles.modalIconWrap}>
                  <Text style={styles.modalEmoji}>⏱️</Text>
                </View>

                <Text style={styles.modeltext}>Auto Replay Timer</Text>
                <Text style={styles.modelSubtext}>
                  Enter the video duration in seconds.{'\n'}
                  E.g. for a 5-minute video: 60 × 5 ={' '}
                  <Text
                    style={{
                      color: D.accent,
                      fontFamily: Fonts.poppinsSemiBold,
                    }}
                  >
                    300
                  </Text>
                </Text>

                <View style={styles.modalInputSection}>
                  <Text style={styles.modalInputLabel}>Seconds *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>⏰</Text>
                    <TextInput
                      value={CustomeMinutes}
                      placeholder="Enter seconds..."
                      placeholderTextColor={D.muted}
                      onFocus={onFocusHandler}
                      onBlur={onBlurHandler}
                      ref={inputRef}
                      onChangeText={val => setCustomeMinutes(val)}
                      maxLength={4}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.modelrowview}>
                  <TouchableOpacity
                    onPress={() => {
                      if (CustomeMinutes !== 0 && CustomeMinutes !== '') {
                        setModalVisible(!modalVisible);
                        navigation.navigate('WebViewWindow', {
                          item: data,
                          link: value,
                          windowScreen,
                          Customevalue,
                          CustomeMinutes,
                        });
                      }
                    }}
                    style={styles.buttoncancel}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.canceltext}>✓ Submit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalDismissBtn}
                  >
                    <Text style={styles.modalDismissTxt}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>
      </TouchableWithoutFeedback>
    </View>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  containe: {
    flex: 1,
    backgroundColor: D.bg,
  },
  scrollContent: {
    paddingBottom: scaleSize(40),
  },

  // hero banner
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(14),
    margin: scaleSize(14),
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: scaleSize(18),
    padding: scaleSize(16),
  },
  heroIconWrap: {
    width: scaleSize(52),
    height: scaleSize(52),
    borderRadius: scaleSize(16),
    backgroundColor: 'rgba(124,106,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroEmoji: { fontSize: scaleFont(26) },
  heroTextCol: { flex: 1 },
  heroTitle: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.text,
    marginBottom: scaleSize(3),
  },
  heroSub: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
    lineHeight: scaleSize(16),
  },

  // form card
  subContainer: {
    backgroundColor: D.card,
    marginHorizontal: scaleSize(14),
    borderRadius: scaleSize(20),
    borderWidth: 1,
    borderColor: D.border,
    padding: scaleSize(18),
    marginBottom: scaleSize(16),
  },

  // section label row
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(8),
    marginBottom: scaleSize(10),
  },
  labelDot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: D.accent,
  },
  textStyle: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.text,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: 'rgba(124,106,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.3)',
    borderRadius: scaleSize(999),
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(2),
  },
  requiredTxt: {
    fontSize: scaleFont(9),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.accent,
    letterSpacing: 0.5,
  },

  // input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.inputBg,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: scaleSize(12),
    paddingHorizontal: scaleSize(12),
    marginBottom: scaleSize(4),
  },
  inputIcon: {
    fontSize: scaleFont(16),
    marginRight: scaleSize(8),
  },
  input: {
    flex: 1,
    fontFamily: Fonts.poppinsMedium,
    fontSize: scaleFont(13),
    color: D.text,
    paddingVertical: scaleSize(13),
  },

  // window buttons
  buttonSubContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: scaleSize(8),
    marginBottom: scaleSize(6),
  },
  windowBtn: {
    paddingVertical: scaleSize(12),
    borderRadius: scaleSize(12),
    borderWidth: 1.5,
    borderColor: D.border,
    backgroundColor: D.surface,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleSize(6),
  },
  windowBtnActive: {
    borderColor: 'rgba(124,106,247,0.6)',
    backgroundColor: 'rgba(124,106,247,0.14)',
  },
  windowBtnDot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: D.accent,
  },
  windowBtnTxt: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.muted,
  },
  windowBtnTxtActive: {
    color: D.accent,
  },

  // or row
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(10),
    marginVertical: scaleSize(14),
  },
  orLine: { flex: 1, height: 1, backgroundColor: D.border },
  textor: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
  },

  // checkbox
  checkboxRow: {
    marginTop: scaleSize(14),
    marginBottom: scaleSize(6),
  },

  // error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleSize(8),
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.28)',
    borderRadius: scaleSize(10),
    padding: scaleSize(12),
    marginBottom: scaleSize(12),
  },
  errorIcon: { fontSize: scaleFont(14) },
  errorTxt: {
    flex: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.poppinsRegular,
    color: D.error,
    lineHeight: scaleSize(18),
  },

  // submit button
  buttonClick: {
    backgroundColor: D.accent,
    borderRadius: scaleSize(14),
    paddingVertical: scaleSize(15),
    alignItems: 'center',
    marginTop: scaleSize(14),
    shadowColor: D.accent,
    shadowOpacity: 0.4,
    shadowRadius: scaleSize(12),
    elevation: 6,
  },
  buttonTextStyle: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.poppinsBold,
    color: D.white,
    letterSpacing: 0.3,
  },

  // modal
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  modalView: {
    backgroundColor: D.surface,
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: D.border,
    padding: scaleSize(20),
    paddingBottom: Platform.OS === 'ios' ? scaleSize(40) : scaleSize(24),
  },
  modalHandle: {
    width: scaleSize(40),
    height: scaleSize(4),
    backgroundColor: D.border,
    borderRadius: scaleSize(2),
    alignSelf: 'center',
    marginBottom: scaleSize(16),
  },
  modalIconWrap: {
    width: scaleSize(56),
    height: scaleSize(56),
    borderRadius: scaleSize(28),
    backgroundColor: 'rgba(124,106,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: scaleSize(12),
  },
  modalEmoji: { fontSize: scaleFont(28) },
  modeltext: {
    fontSize: scaleFont(17),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.text,
    textAlign: 'center',
    marginBottom: scaleSize(6),
  },
  modelSubtext: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
    textAlign: 'center',
    lineHeight: scaleSize(18),
    marginBottom: scaleSize(16),
  },
  modalInputSection: { gap: scaleSize(8), marginBottom: scaleSize(16) },
  modalInputLabel: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.muted,
  },
  modelrowview: {
    gap: scaleSize(10),
  },
  buttoncancel: {
    backgroundColor: D.accent,
    borderRadius: scaleSize(14),
    paddingVertical: scaleSize(14),
    alignItems: 'center',
    shadowColor: D.accent,
    shadowOpacity: 0.4,
    shadowRadius: scaleSize(10),
    elevation: 5,
  },
  canceltext: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.poppinsBold,
    color: D.white,
    letterSpacing: 0.3,
  },
  modalDismissBtn: {
    paddingVertical: scaleSize(12),
    alignItems: 'center',
  },
  modalDismissTxt: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
  },

  // compat
  otherCards: {
    height: screenWidth * (0.85 * 0.45),
    width: screenWidth - 22,
    borderRadius: scaleSize(12),
  },
  errorStyle: { marginTop: scaleSize(10) },
});

export default PageWindow;
