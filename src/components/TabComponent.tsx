// components/TabComponent.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { isIOS } from '../helper/appUtils';
import Mixins from '../resource/mixins/appStyle';
import Fonts from '../resource/theme/font';

interface TabComponentProps {
  isFocused: boolean;
  index: number;
  options: any;
  tabs: Array<any>;
  onTabPress: () => void;
}

const { scaleSize, scaleFont } = Mixins;

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const D = {
  bg: '#09090F',
  surface: '#101019',
  border: '#252538',
  accent: '#7C6AF7',
  pink: '#F76A8A',
  teal: '#6AF7C8',
  yellow: '#FBBF24',
  text: '#F0EEFF',
  muted: '#6B6880',
  white: '#FFFFFF',
};

// accent colour per tab index
const TAB_ACCENTS = [D.accent, D.pink, D.teal, D.yellow, '#60A5FA'];

// haptic options
const HAPTIC_OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// ─────────────────────────────────────────────
// TabComponent
// ─────────────────────────────────────────────
const TabComponent = ({
  isFocused,
  index,
  options,
  tabs,
  onTabPress,
}: TabComponentProps) => {
  const accent = TAB_ACCENTS[index % TAB_ACCENTS.length];

  // ── Animations ────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(isFocused ? 1.15 : 1)).current;
  const labelOpacity = useRef(new Animated.Value(isFocused ? 1 : 0.45)).current;
  const pillWidth = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const glowOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const dotScale = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  // run whenever focus changes
  useEffect(() => {
    if (isFocused) {
      // bounce icon up
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -6,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]).start();

      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1.18,
          useNativeDriver: true,
          tension: 180,
          friction: 8,
        }),
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(pillWidth, {
          toValue: 1,
          useNativeDriver: true,
          tension: 160,
          friction: 9,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(dotScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
        Animated.timing(labelOpacity, {
          toValue: 0.45,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(pillWidth, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(dotScale, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
      ]).start();
    }
  }, [isFocused]);

  // ── Press handlers ─────────────────────────
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    // haptic feedback
    try {
      ReactNativeHapticFeedback.trigger(
        isFocused ? 'selection' : 'impactLight',
        HAPTIC_OPTIONS,
      );
    } catch {}
    onTabPress();
  };

  // ── Pill scale interpolation ───────────────
  const pillScaleX = pillWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <TouchableOpacity
      key={`route_${index}`}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      style={styles.tabButton}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* ── Glow blob behind icon ── */}
        <Animated.View
          style={[
            styles.glowBlob,
            { backgroundColor: accent + '22', opacity: glowOpacity },
          ]}
        />

        {/* ── Icon with bounce ── */}
        <Animated.View
          style={[
            styles.iconWrap,
            isFocused && {
              backgroundColor: accent + '18',
              borderColor: accent + '40',
            },
            { transform: [{ scale: iconScale }, { translateY }] },
          ]}
        >
          {tabs[index].icon({
            color: isFocused ? accent : D.muted,
          })}

          {/* active dot on icon */}
          <Animated.View
            style={[
              styles.activeDot,
              { backgroundColor: accent, transform: [{ scale: dotScale }] },
            ]}
          />
        </Animated.View>

        {/* ── Label ── */}
        <Animated.Text
          style={[
            styles.tabTitle,
            { color: isFocused ? accent : D.muted, opacity: labelOpacity },
          ]}
        >
          {tabs[index].title}
        </Animated.Text>

        {/* ── Active indicator pill at bottom ── */}
        <Animated.View
          style={[
            styles.activePill,
            {
              backgroundColor: accent,
              transform: [{ scaleX: pillScaleX }],
              opacity: pillWidth,
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default TabComponent;

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(8),
    position: 'relative',
    width: '100%',
  },
  glowBlob: {
    position: 'absolute',
    width: scaleSize(52),
    height: scaleSize(52),
    borderRadius: scaleSize(26),
    top: scaleSize(2),
  },
  iconWrap: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: scaleSize(3),
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: scaleSize(5),
    right: scaleSize(5),
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    borderWidth: 1.5,
    borderColor: D.bg,
  },
  tabTitle: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: scaleFont(10),
    letterSpacing: 0.3,
    marginBottom: scaleSize(4),
  },
  activePill: {
    height: scaleSize(3),
    width: scaleSize(28),
    borderRadius: scaleSize(2),
  },
});

// local D reference for styles
const D_ref = { bg: '#09090F', muted: '#6B6880' };
