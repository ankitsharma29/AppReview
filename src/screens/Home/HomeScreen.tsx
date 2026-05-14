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
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  keywords: [
    'fashion',
    'clothing',
    'shopping',
    'lifestyle',
    'ecommerce',
    'trends',
    'retail',
    'accessories',
    'luxury',
    'apparel',
    'deals',
    'boutique',
    'style',
    'outfits',
    'designer',
  ],
});

const { scaleFont, scaleSize } = Mixins;
const { width: W } = Dimensions.get('window');

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

// ─────────────────────────────────────────────
// Design tokens — dark modern palette
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
  white: '#FFFFFF',
  black: '#000000',
};

// card accent per index
const CARD_THEMES = [
  {
    accent: '#7C6AF7',
    glow: 'rgba(124,106,247,0.15)',
    border: 'rgba(124,106,247,0.38)',
    bg: 'rgba(124,106,247,0.08)',
    strip: '#7C6AF7',
  },
  {
    accent: '#F76A8A',
    glow: 'rgba(247,106,138,0.15)',
    border: 'rgba(247,106,138,0.38)',
    bg: 'rgba(247,106,138,0.08)',
    strip: '#F76A8A',
  },
  {
    accent: '#6AF7C8',
    glow: 'rgba(106,247,200,0.15)',
    border: 'rgba(106,247,200,0.38)',
    bg: 'rgba(106,247,200,0.08)',
    strip: '#6AF7C8',
  },
  {
    accent: '#FBBF24',
    glow: 'rgba(251,191,36,0.15)',
    border: 'rgba(251,191,36,0.38)',
    bg: 'rgba(251,191,36,0.08)',
    strip: '#FBBF24',
  },
  {
    accent: '#60A5FA',
    glow: 'rgba(96,165,250,0.15)',
    border: 'rgba(96,165,250,0.38)',
    bg: 'rgba(96,165,250,0.08)',
    strip: '#60A5FA',
  },
];

// emoji per card based on screen/flag
const CARD_META: Record<string, { emoji: string; tag: string }> = {
  PageWindow_oneMinute: { emoji: '▶️', tag: 'MULTI TAB' },
  NetSpeedChecker: { emoji: '📡', tag: 'SPEED' },
  PageWindow_autoPlay: { emoji: '🔁', tag: 'AUTO PLAY' },
  PageWindow_addMinutes: { emoji: '⏱️', tag: 'LOOP' },
  PageWindow_link: { emoji: '🔗', tag: 'MORE APPS' },
};

function getCardMeta(screen: string, flag: string) {
  const key = flag ? `${screen}_${flag}` : screen;
  return CARD_META[key] ?? { emoji: '⚡', tag: 'FEATURE' };
}

// ─────────────────────────────────────────────
// Single animated home card
// (replaces the plain subContainer view)
// ─────────────────────────────────────────────
function HomeCard({
  item,
  index,
  onPress,
}: {
  item: any;
  index: number;
  onPress: (item: any) => void;
}) {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const meta = getCardMeta(item.screen, item.flag);

  const fadeY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeY, {
        toValue: 0,
        duration: 450,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
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
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY: fadeY }, { scale }],
        marginVertical: scaleSize(8),
      }}
    >
      {/* glow */}
      <View style={[styles.cardGlow, { backgroundColor: theme.glow }]} />

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(item)}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.subContainer, { borderColor: theme.border }]}
      >
        {/* top accent strip */}
        <View style={[styles.cardStrip, { backgroundColor: theme.strip }]} />

        {/* header row: emoji + tag + arrow */}
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.cardIconWrap,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <Text style={styles.cardEmoji}>{meta.emoji}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View
              style={[
                styles.cardTag,
                { backgroundColor: theme.bg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.cardTagTxt, { color: theme.accent }]}>
                {meta.tag}
              </Text>
            </View>
            <View style={[styles.cardArrowWrap, { borderColor: theme.border }]}>
              <Text style={[styles.cardArrowTxt, { color: theme.accent }]}>
                ›
              </Text>
            </View>
          </View>
        </View>

        {/* title */}
        <Text style={styles.cardTitle}>{item.title}</Text>

        {/* description (des) */}
        {!!item.des && (
          <View
            style={[
              styles.cardDesBadge,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardDes, { color: theme.accent }]}>
              {item.des}
            </Text>
          </View>
        )}

        {/* separator */}
        <View style={[styles.cardSep, { backgroundColor: theme.border }]} />

        {/* CTA button */}
        <TouchableOpacity
          style={[
            styles.cardBtn,
            { backgroundColor: theme.bg, borderColor: theme.border },
          ]}
          onPress={() => onPress(item)}
          activeOpacity={0.8}
        >
          <Text style={[styles.cardBtnTxt, { color: theme.accent }]}>
            Open Feature
          </Text>
          <Text style={[styles.cardBtnArrow, { color: theme.accent }]}>→</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main screen
// (ALL original logic preserved — only JSX/styles changed)
// ─────────────────────────────────────────────
const HomeScreen = ({ navigation }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const isFocused = useIsFocused();

  // ── original data ──────────────────────────
  const HomeData = [
    {
      title: 'Get More Views In Multiple Tab',
      des: '*Your Video Must Be Longer Than one Minute',
      screen: 'PageWindow',
      flag: 'oneMinute',
    },
    { title: 'Check Net Speed', des: '', screen: 'NetSpeedChecker', flag: '' },
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

  // ── original navigationScreen logic ────────
  const navigationScreen = (item: any) => {
    try {
      if (item.flag === 'link') {
        openUrl(
          'https://play.google.com/store/apps/dev?id=6984237370327765283&hl=en_IN&gl=US',
        );
        appOpenAd.show();
        return;
      } else {
        navigation.navigate(item?.screen, { item: item });
      }
      appOpenAd.show();
    } catch (error) {
      navigation.navigate(item?.screen, { item: item });
      setCrashlaticsLog(error);
    }
  };

  useEffect(() => {
    appOpenAd.load();
  }, [isFocused]);
  useEffect(() => {
    checkAppUpdate();
  }, []);

  const fcmTokenset = async () => {
    const fcmToken = await messaging().getToken();
    const newTodoRef = database().ref('/AppGrowtodos').push();
    newTodoRef.set({ id: newTodoRef.key, text: fcmToken, completed: false });
  };

  useEffect(() => {}, []);

  const checkAppUpdate = async () => {
    try {
      const version = await checkVersion();
      if (version.needsUpdate) setModalVisible(true);
    } catch (error) {
      console.log('App check error', error);
    }
  };

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fireEvent = async () => {
      await analytics()
        .logEvent('Home', {
          screen: 'HomeSceen',
          type: 'OneMinute',
          purpose: 'View',
        })
        .then(res => console.log('res', res))
        .catch(() => console.error('Error in track'));
    };
    fireEvent();
  }, []);

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
          setGameList({
            title: 'Game Section',
            data: response?.data?.slice(11, 15),
            showViewAll: 'viewall',
            viewAllUrl: 'viewall',
          });
        });
    } catch (error) {}
  };

  const onItemPress = async () => {
    await interstitial.show();
    navigation.navigate('GameList');
  };
  const onItemAdsPress = async () => {
    navigation.navigate('AdsList');
    await interstitial.show();
  };
  const onItemAdsPressV = async (item: any) => {
    Linking.openURL(item?.channelUrl);
  };
  const onGameItemPress = async (item: any) => {
    const userId = await getDeviceId();
    customWebTab(`${item.url}?sub=${userId}`).then(res =>
      console.log('res', res),
    );
    appOpenAd.show();
  };

  const ImageRenderCard = useCallback(
    ({ item }: any) => (
      <Pressable
        onPress={() => Linking.openURL(item?.channelUrl)}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: scaleSize(12),
        }}
      >
        <Image
          source={
            isValidUrl(item?.image)
              ? { uri: item?.image }
              : 'data:image/png;base64,' + item?.image
          }
          style={styles.otherCards}
          resizeMode="cover"
        />
      </Pressable>
    ),
    [],
  );

  const imageCrousal = [
    { image: AppImages.freeBrandBanner, channelUrl: '' },
    { image: AppImages.freeBrandBanner, channelUrl: '' },
  ];

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

  // ─────────────────────────────────────────
  return (
    <View style={styles.containe}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />

      {/* ── Header (original component preserved) ── */}
      <Header
        title={'View & Watch Time Browser'}
        navigation={navigation}
        backButton={false}
        historyButton={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Hero banner ── */}
        <Animated.View
          style={[
            styles.heroBanner,
            { opacity: hdrFade, transform: [{ translateY: hdrY }] },
          ]}
        >
          <View style={styles.heroTextCol}>
            <View style={styles.heroPillRow}>
              <View style={styles.heroPill}>
                <View style={styles.heroPillDot} />
                <Text style={styles.heroPillTxt}>
                  VIEW & WATCH TIME BROWSER
                </Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Boost Your{'\n'}Watch Time</Text>
            <Text style={styles.heroSub}>
              Smart tools to grow your channel views
            </Text>
          </View>
          {/* decorative rings */}
          <View style={styles.heroRingOuter}>
            <View style={styles.heroRingMid}>
              <View style={styles.heroRingInner}>
                <Text style={styles.heroRingEmoji}>▶️</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Stat chips ── */}
        <Animated.View style={[styles.chipRow, { opacity: hdrFade }]}>
          {[
            { icon: '👁️', label: 'Views' },
            { icon: '⏱️', label: 'Watch Time' },
            { icon: '📡', label: 'Net Speed' },
            { icon: '🔁', label: 'Auto Play' },
          ].map(c => (
            <View key={c.label} style={styles.chip}>
              <Text style={styles.chipIcon}>{c.icon}</Text>
              <Text style={styles.chipTxt}>{c.label}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.margin10}>
          {/* ── Banner Ad (original) ── */}
          <BannerAds
            BaneerSize="390x170"
            adUnitId={'ca-app-pub-4293747280421578/5005960189'}
          />

          {/* ── Section heading ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTxt}>FEATURES</Text>
            <View style={styles.sectionLine} />
          </View>

          {/* ── Feature cards (replaces plain subContainer map) ── */}
          {HomeData.map((item: any, index: number) => (
            <HomeCard
              key={`${item.screen}_${item.flag}_${index}`}
              item={item}
              index={index}
              onPress={navigationScreen}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Update Modal (original logic, redesigned UI) ── */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* handle bar */}
            <View style={styles.modalHandle} />

            <Text style={styles.modeltext}>🚀 New Version Available!</Text>
            <Text style={styles.modelsubtext}>
              A new and improved version is available with exciting new features
              and content.
            </Text>

            <View style={styles.modelrowview}>
              <TouchableOpacity
                onPress={async () => {
                  openUrl(
                    'https://play.google.com/store/apps/details?id=com.appgrowreview&hl=en_IN&gl=US',
                  );
                }}
                style={styles.buttonUpdate}
                activeOpacity={0.85}
              >
                <Text style={styles.Updatetext}>Update Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.skipBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.skipTxt}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────
// Styles — dark modern theme
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── root ──
  containe: {
    flex: 1,
    backgroundColor: D.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleSize(40),
  },
  margin10: {
    marginHorizontal: scaleSize(12),
  },

  // ── hero banner ──
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: scaleSize(12),
    marginTop: scaleSize(16),
    marginBottom: scaleSize(14),
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: scaleSize(20),
    padding: scaleSize(18),
    overflow: 'hidden',
  },
  heroTextCol: { flex: 1 },
  heroPillRow: { marginBottom: scaleSize(10) },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: scaleSize(6),
    backgroundColor: 'rgba(124,106,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.3)',
    borderRadius: scaleSize(999),
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(4),
  },
  heroPillDot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: '#7C6AF7',
  },
  heroPillTxt: {
    fontSize: scaleFont(8),
    fontFamily: Fonts.poppinsSemiBold,
    color: '#7C6AF7',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: scaleFont(20),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.text,
    lineHeight: scaleSize(28),
    marginBottom: scaleSize(6),
  },
  heroSub: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
    lineHeight: scaleSize(16),
  },
  heroRingOuter: {
    width: scaleSize(76),
    height: scaleSize(76),
    borderRadius: scaleSize(38),
    backgroundColor: 'rgba(124,106,247,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scaleSize(12),
  },
  heroRingMid: {
    width: scaleSize(54),
    height: scaleSize(54),
    borderRadius: scaleSize(27),
    backgroundColor: 'rgba(124,106,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingInner: {
    width: scaleSize(34),
    height: scaleSize(34),
    borderRadius: scaleSize(17),
    backgroundColor: '#7C6AF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingEmoji: { fontSize: scaleFont(16) },

  // ── stat chips ──
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: scaleSize(12),
    marginBottom: scaleSize(16),
    gap: scaleSize(6),
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: scaleSize(12),
    paddingVertical: scaleSize(10),
    gap: scaleSize(4),
  },
  chipIcon: { fontSize: scaleFont(16) },
  chipTxt: {
    fontSize: scaleFont(8),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.muted,
    textAlign: 'center',
  },

  // ── section heading ──
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(6),
    marginTop: scaleSize(10),
    gap: scaleSize(10),
  },
  sectionTxt: {
    fontSize: scaleFont(9),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.muted,
    letterSpacing: 2.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: D.border,
  },

  // ── card ──
  cardGlow: {
    position: 'absolute',
    top: scaleSize(12),
    left: scaleSize(28),
    right: scaleSize(28),
    height: scaleSize(36),
    borderRadius: scaleSize(20),
    opacity: 0.7,
    zIndex: 0,
  },
  subContainer: {
    // replaces original plain subContainer
    backgroundColor: D.card,
    borderWidth: 1.5,
    borderRadius: scaleSize(18),
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  cardStrip: {
    height: scaleSize(3),
    width: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: scaleSize(14),
    paddingBottom: scaleSize(8),
  },
  cardIconWrap: {
    width: scaleSize(56),
    height: scaleSize(56),
    borderRadius: scaleSize(16),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: scaleFont(26) },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: scaleSize(8),
  },
  cardTag: {
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(4),
    borderRadius: scaleSize(999),
    borderWidth: 1,
  },
  cardTagTxt: {
    fontSize: scaleFont(8),
    fontFamily: Fonts.poppinsSemiBold,
    letterSpacing: 1.5,
  },
  cardArrowWrap: {
    width: scaleSize(30),
    height: scaleSize(30),
    borderRadius: scaleSize(15),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowTxt: {
    fontSize: scaleFont(22),
    fontFamily: Fonts.poppinsSemiBold,
    lineHeight: scaleSize(28),
  },
  cardTitle: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.text,
    paddingHorizontal: scaleSize(14),
    marginBottom: scaleSize(8),
    lineHeight: scaleSize(22),
  },
  cardDesBadge: {
    marginHorizontal: scaleSize(14),
    marginBottom: scaleSize(10),
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(6),
    borderRadius: scaleSize(8),
    borderWidth: 1,
  },
  cardDes: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.poppinsRegular,
    lineHeight: scaleSize(16),
  },
  cardSep: {
    height: 1,
    marginHorizontal: scaleSize(14),
    marginBottom: scaleSize(12),
    opacity: 0.4,
  },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSize(8),
    marginHorizontal: scaleSize(14),
    marginBottom: scaleSize(14),
    borderWidth: 1.5,
    borderRadius: scaleSize(12),
    paddingVertical: scaleSize(12),
  },
  cardBtnTxt: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.poppinsSemiBold,
    letterSpacing: 0.3,
  },
  cardBtnArrow: {
    fontSize: scaleFont(16),
    fontFamily: Fonts.poppinsSemiBold,
  },

  // ── original unchanged ──
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

  // ── modal — redesigned bottom sheet ──
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalView: {
    width: '100%',
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
  modelrowview: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: scaleSize(10),
    marginTop: scaleSize(16),
  },
  modeltext: {
    fontSize: scaleFont(20),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.text,
    lineHeight: scaleSize(28),
    textAlign: 'center',
    marginBottom: scaleSize(6),
  },
  modelsubtext: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
    lineHeight: scaleSize(20),
    textAlign: 'center',
  },
  buttonUpdate: {
    height: scaleSize(52),
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7C6AF7',
    borderRadius: scaleSize(999),
    shadowColor: '#7C6AF7',
    shadowOpacity: 0.45,
    shadowRadius: scaleSize(12),
    elevation: 6,
  },
  Updatetext: {
    fontSize: scaleFont(15),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.white,
    letterSpacing: 0.4,
  },
  skipBtn: {
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(24),
  },
  skipTxt: {
    fontSize: scaleFont(13),
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
  },

  // original carousel dots (unchanged)
  dotStyle: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(6),
    backgroundColor: D.white,
  },
  inactiveDotStyle: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(6),
    backgroundColor: '#7C6AF7',
  },
});

export default HomeScreen;
