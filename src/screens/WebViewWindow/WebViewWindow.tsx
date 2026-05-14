import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import WebViewPage from '../../components/WebViewPage';
import Mixins from '../../resource/mixins/appStyle';
import Colors from '../../resource/theme/color';
import CommonLoader from '../../components/CommonLoader';
import Fonts from '../../resource/theme/font';
import { isIOS } from '../../helper/appUtils';
import BannerAds from '../../components/Ads/BannerAds';
import { BannerAdSize } from 'react-native-google-mobile-ads';
import Header from '../../components/Header';

const { scaleFont, scaleSize } = Mixins;
const { width: SCREEN_W } = Dimensions.get('window');

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
  yellow: '#FBBF24',
  text: '#F0EEFF',
  muted: '#6B6880',
  white: '#FFFFFF',
};

// ─────────────────────────────────────────────
// Animated stat tile
// ─────────────────────────────────────────────
function StatTile({
  icon,
  label,
  value,
  accent,
  pulse,
}: {
  icon: string;
  label: string;
  value: string | number;
  accent: string;
  pulse?: boolean;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.statTile,
        { borderColor: accent + '40', transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main Screen — ALL original logic preserved
// ─────────────────────────────────────────────
const WebViewWindow = ({ navigation, route }: any) => {
  const data = route?.params?.item;
  const UrlWeb = route?.params?.link;
  const Customevalue = route?.params?.Customevalue;
  const windowScreen = route?.params?.windowScreen;

  const [webData, setwebData] = useState<any>([]);
  const [ViewShow, setViewShow] = useState<any>(0);

  // ── original timer logic (unchanged) ────────
  const [timer, setTimer] = useState<number | any>(
    data?.flag === 'addMinutes' ? route?.params?.CustomeMinutes : 60,
  );

  useEffect(() => {
    try {
      if (data?.flag !== 'autoPlay') {
        const interval = setInterval(() => {
          if (timer === 0 && interval) {
            navigation.goBack();
            clearInterval(interval);
            return;
          }
          timer > 0 && setTimer(timer - 1);
        }, 1000);
        return () => {
          interval && clearInterval(interval);
        };
      }
    } catch (error) {
      console.log('error', error);
    }
  }, [timer]);

  // ── original web window logic (unchanged) ───
  useEffect(() => {
    let windowArray: any = 0;
    if (Customevalue >= windowScreen) {
      windowArray = Customevalue;
    } else {
      windowArray = windowScreen;
    }
    setViewShow(windowArray);
    for (let value = 0; value < windowArray; value++) {
      setwebData((prevState: any) => [
        ...prevState,
        { url: UrlWeb, id: value },
      ]);
    }
  }, []);
  // ── end original logic ──────────────────────

  // timer colour: green → yellow → red
  const timerAccent = timer > 30 ? D.teal : timer > 10 ? D.yellow : D.pink;

  // flag determines which stats to show
  const showTimer = data?.flag === 'oneMinute' || data?.flag === 'addMinutes';

  // header entrance
  const hdrFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(hdrFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />

      {/* original Header component — unchanged */}
      <Header title={'Browser Screen'} navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats bar (shown only for oneMinute / addMinutes) ── */}
        {showTimer && (
          <Animated.View style={[styles.statsRow, { opacity: hdrFade }]}>
            <StatTile
              icon="⏱️"
              label="Seconds Left"
              value={timer}
              accent={timerAccent}
              pulse={timer <= 10}
            />
            <StatTile
              icon="👁️"
              label="Views Open"
              value={ViewShow}
              accent={D.accent}
            />
            <StatTile
              icon="🔄"
              label="Mode"
              value={data?.flag === 'addMinutes' ? 'Loop' : '1 min'}
              accent={D.teal}
            />
          </Animated.View>
        )}

        {/* autoPlay mode — simple view count badge */}
        {data?.flag === 'autoPlay' && (
          <Animated.View style={[styles.autoPlayRow, { opacity: hdrFade }]}>
            <View style={styles.autoPlayBadge}>
              <View style={styles.autoPlayDot} />
              <Text style={styles.autoPlayTxt}>AUTO PLAY MODE</Text>
            </View>
            <View style={styles.viewCountBadge}>
              <Text style={styles.viewCountTxt}>👁️ {ViewShow} Windows</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Timer message bar ── */}
        {showTimer && (
          <View
            style={[
              styles.msgBar,
              {
                borderColor: timerAccent + '35',
                backgroundColor: timerAccent + '0D',
              },
            ]}
          >
            <Text style={styles.msgBarIcon}>
              {data?.flag === 'addMinutes' ? '🔁' : '⏳'}
            </Text>
            <Text style={[styles.msgBarTxt, { color: timerAccent }]}>
              {data?.flag === 'addMinutes'
                ? 'Custom timer — video will auto-replay when it reaches 0'
                : 'Your video must be longer than 1 minute'}
            </Text>
          </View>
        )}

        {/* ── Top Banner Ad — original unchanged ── */}
        <BannerAds
          BaneerSize={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          adUnitId={'ca-app-pub-4293747280421578/7057408451'}
        />

        {/* ── Section label ── */}
        {webData.length > 0 && (
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTxt}>ACTIVE WINDOWS</Text>
            <View style={styles.sectionLine} />
            <View style={styles.windowCountBadge}>
              <Text style={styles.windowCountTxt}>{webData.length}</Text>
            </View>
          </View>
        )}

        {/* ── WebView windows grid — original logic unchanged ── */}
        <View style={styles.webGrid}>
          {webData.length !== 0 &&
            webData.map((item: any) => (
              <View key={item.id} style={styles.webViewWrapper}>
                {/* window number badge */}
                <View style={styles.windowNumBadge}>
                  <Text style={styles.windowNumTxt}>#{item.id + 1}</Text>
                </View>
                <WebViewPage Requesturl={item.url} />
              </View>
            ))}
        </View>

        {/* ── Bottom Banner Ad — original unchanged ── */}
        <BannerAds
          BaneerSize={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          adUnitId={'ca-app-pub-4293747280421578/8178918435'}
        />
      </ScrollView>
    </View>
  );
};

export default WebViewWindow;

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: D.bg,
  },
  scrollContent: {
    paddingBottom: scaleSize(30),
  },

  // stats row
  statsRow: {
    flexDirection: 'row',
    gap: scaleSize(8),
    margin: scaleSize(14),
    marginBottom: scaleSize(8),
  },
  statTile: {
    flex: 1,
    backgroundColor: D.card,
    borderWidth: 1.5,
    borderRadius: scaleSize(14),
    alignItems: 'center',
    paddingVertical: scaleSize(12),
    gap: scaleSize(3),
  },
  statIcon: { fontSize: scaleFont(20) },
  statValue: {
    fontSize: scaleFont(20),
    fontFamily: Fonts.poppinsBold,
    lineHeight: scaleSize(26),
  },
  statLabel: {
    fontSize: scaleFont(9),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // auto play row
  autoPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: scaleSize(14),
    marginTop: scaleSize(14),
    marginBottom: scaleSize(8),
  },
  autoPlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(6),
    backgroundColor: 'rgba(106,247,200,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(106,247,200,0.28)',
    borderRadius: scaleSize(999),
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
  },
  autoPlayDot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: D.teal,
  },
  autoPlayTxt: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.poppinsBold,
    color: D.teal,
    letterSpacing: 1.5,
  },
  viewCountBadge: {
    backgroundColor: 'rgba(124,106,247,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.28)',
    borderRadius: scaleSize(999),
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(6),
  },
  viewCountTxt: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.accent,
  },

  // timer message bar
  msgBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleSize(10),
    marginHorizontal: scaleSize(14),
    marginBottom: scaleSize(10),
    borderWidth: 1,
    borderRadius: scaleSize(12),
    padding: scaleSize(12),
  },
  msgBarIcon: { fontSize: scaleFont(16) },
  msgBarTxt: {
    flex: 1,
    fontSize: scaleFont(12),
    fontFamily: Fonts.poppinsRegular,
    lineHeight: scaleSize(18),
  },

  // section label
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scaleSize(14),
    marginTop: scaleSize(10),
    marginBottom: scaleSize(10),
    gap: scaleSize(10),
  },
  sectionTxt: {
    fontSize: scaleFont(9),
    fontFamily: Fonts.poppinsBold,
    color: D.muted,
    letterSpacing: 2.5,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: D.border },
  windowCountBadge: {
    width: scaleSize(22),
    height: scaleSize(22),
    borderRadius: scaleSize(11),
    backgroundColor: D.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  windowCountTxt: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.poppinsBold,
    color: D.white,
  },

  // web grid
  webGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: scaleSize(10),
    gap: scaleSize(8),
  },
  webViewWrapper: {
    position: 'relative',
    width: '47%',
    borderRadius: scaleSize(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: D.border,
    backgroundColor: D.card,
  },
  windowNumBadge: {
    position: 'absolute',
    top: scaleSize(6),
    left: scaleSize(6),
    zIndex: 10,
    backgroundColor: 'rgba(124,106,247,0.85)',
    borderRadius: scaleSize(6),
    paddingHorizontal: scaleSize(6),
    paddingVertical: scaleSize(2),
  },
  windowNumTxt: {
    fontSize: scaleFont(9),
    fontFamily: Fonts.poppinsBold,
    color: D.white,
    letterSpacing: 0.3,
  },

  // compat
  subContainer: {
    borderRadius: scaleSize(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: D.accent,
    margin: scaleSize(10),
    width: '40%',
    height: '25%',
  },
  TopView: {
    borderRadius: scaleSize(5),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: D.border,
    padding: scaleSize(10),
    marginHorizontal: scaleSize(2),
    backgroundColor: D.accent,
  },
  textStyle: {
    color: D.white,
    fontSize: scaleSize(18),
    fontFamily: Fonts.poppinsBold,
  },
  textStyleLine: {
    color: D.white,
    fontSize: scaleSize(11),
    fontFamily: Fonts.poppinsSemiBold,
    textAlign: 'center',
  },
  input: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: scaleFont(16),
    color: D.text,
    borderColor: D.border,
    borderWidth: 1,
    borderRadius: scaleSize(5),
    paddingHorizontal: isIOS ? scaleSize(0) : scaleSize(10),
  },
});
