// navigation/tabs/MyTabBar.tsx
import React, { useContext, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { BottomTabDescriptorMap } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import Mixins from '../../resource/mixins/appStyle';
import TabComponent from '../../components/TabComponent';
import { isIOS } from '../../helper/appUtils';
import { AppContext } from '../../context/AppProvider';

interface MyTabBarProps {
  state: TabNavigationState<ParamListBase>;
  descriptors: BottomTabDescriptorMap;
  navigation: any;
  tabs: Array<any>;
}

const { scaleSize } = Mixins;

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const D = {
  bg: '#09090F',
  surface: '#0E0E1A',
  border: '#1E1E30',
  accent: '#7C6AF7',
  pink: '#F76A8A',
  teal: '#6AF7C8',
  yellow: '#FBBF24',
  white: '#FFFFFF',
};

const TAB_ACCENTS = [D.accent, D.pink, D.teal, D.yellow, '#60A5FA'];

// ─────────────────────────────────────────────
// Sliding active background indicator
// ─────────────────────────────────────────────
const SlideIndicator = ({
  tabCount,
  activeIndex,
  accent,
}: {
  tabCount: number;
  activeIndex: number;
  accent: string;
}) => {
  const slideAnim = useRef(new Animated.Value(activeIndex)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: activeIndex,
        useNativeDriver: true,
        tension: 180,
        friction: 12,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
      ]),
    ]).start();
  }, [activeIndex]);

  // We can't use dynamic width here easily, so we use translateX based on percentage
  // Each tab = 100/tabCount % width
  const tabWidthFraction = 1 / tabCount;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.slideIndicator,
        {
          width: `${100 / tabCount}%` as any,
          backgroundColor: TAB_ACCENTS[activeIndex % TAB_ACCENTS.length] + '14',
          borderColor: TAB_ACCENTS[activeIndex % TAB_ACCENTS.length] + '30',
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: Array.from({ length: tabCount }, (_, i) => i),
                outputRange: Array.from({ length: tabCount }, (_, i) => 0), // handled by left position trick
              }),
            },
            { scale: scaleAnim },
          ],
          // shift by activeIndex * (100/tabCount)%  — done via left
          left: `${(activeIndex * 100) / tabCount}%` as any,
        },
      ]}
    />
  );
};

// ─────────────────────────────────────────────
// MyTabBar
// ─────────────────────────────────────────────
const MyTabBar = ({ state, descriptors, navigation, tabs }: MyTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isUserLoggedIn, setCarStack } = useContext(AppContext);

  // entrance animation
  const barFade = useRef(new Animated.Value(0)).current;
  const barY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(barFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(barY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 160,
        friction: 10,
      }),
    ]).start();
  }, []);

  const focusedOptions: any =
    descriptors[state.routes[state.index].key].options;

  if (focusedOptions?.tabBarStyle?.display === 'none') {
    return null;
  }

  const activeAccent = TAB_ACCENTS[state.index % TAB_ACCENTS.length];

  return (
    <Animated.View
      style={[
        styles.outerWrap,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : scaleSize(10),
          opacity: barFade,
          transform: [{ translateY: barY }],
        },
      ]}
    >
      {/* top accent line that shifts colour with active tab */}
      <View style={[styles.topAccentLine, { backgroundColor: activeAccent }]} />

      {/* main tab bar */}
      <View style={styles.tabBar}>
        {/* sliding background indicator */}
        <SlideIndicator
          tabCount={state.routes.length}
          activeIndex={state.index}
          accent={activeAccent}
        />

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onTabPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && route.name === 'Collection') {
              setCarStack('CarCollection');
            }
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          return (
            <TabComponent
              isFocused={isFocused}
              index={index}
              options={options}
              tabs={tabs}
              key={`tab-${index}`}
              onTabPress={onTabPress}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

export default MyTabBar;

const styles = StyleSheet.create({
  outerWrap: {
    backgroundColor: D.surface,
    borderTopWidth: 1,
    borderTopColor: D.border,
    // subtle top shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
  topAccentLine: {
    height: 2,
    width: '30%',
    alignSelf: 'center',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.7,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: scaleSize(6),
    paddingHorizontal: scaleSize(4),
    position: 'relative',
    overflow: 'hidden',
  },
  slideIndicator: {
    position: 'absolute',
    top: scaleSize(4),
    height: scaleSize(68),
    borderRadius: scaleSize(16),
    borderWidth: 1,
  },
});
