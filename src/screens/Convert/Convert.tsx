// src/screens/DashboardScreen.tsx
// Drop this file into your project.
// Requires: @react-navigation/native (for navigation.navigate)
// Each card navigates to: 'Converter' | 'ImageResize' | 'PdfResize'

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING } from '../../utils/theme';
import Header from '../../components/Header';

const { width: W } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Card config
// ─────────────────────────────────────────────
const CARDS = [
  {
    route: 'Content',
    emoji: '🔄',
    badge: 'CONVERT & PDF',
    title: 'Image Converter',
    subtitle: 'Format changer + PDF creator',
    desc: 'Convert images between JPG, PNG, JPEG and WEBP formats. Or merge multiple photos into one clean PDF.',
    accent: '#7C6AF7',
    glow: 'rgba(124,106,247,0.22)',
    border: 'rgba(124,106,247,0.45)',
    bg: 'rgba(124,106,247,0.07)',
    pills: ['JPG', 'PNG', 'WEBP', '→ PDF'],
    bullets: [
      { icon: '🔄', label: 'Batch format convert' },
      { icon: '📄', label: 'Merge images into PDF' },
      { icon: '⚡', label: 'Fast on-device processing' },
    ],
  },
  {
    route: 'ImageResizeScreen',
    emoji: '🗜️',
    badge: 'COMPRESS',
    title: 'Image Compressor',
    subtitle: 'Shrink images to exact KB / MB',
    desc: 'Set any target size — 50 KB, 200 KB, 1 MB — and our smart engine compresses automatically.',
    accent: '#F76A8A',
    glow: 'rgba(247,106,138,0.22)',
    border: 'rgba(247,106,138,0.45)',
    bg: 'rgba(247,106,138,0.07)',
    pills: ['50 KB', '200 KB', '1 MB', 'Custom'],
    bullets: [
      { icon: '🎯', label: 'Hit exact target file size' },
      { icon: '📉', label: 'Up to 95% size reduction' },
      { icon: '🖼️', label: 'Preserves image quality' },
    ],
  },
  {
    route: 'PdfResizeScreen',
    emoji: '📉',
    badge: 'PDF SIZE',
    title: 'PDF Compressor',
    subtitle: 'Build + compress PDF to target size',
    desc: 'Add images as pages, set a size limit, and get a compressed PDF ready to share or upload.',
    accent: '#6AF7C8',
    glow: 'rgba(106,247,200,0.22)',
    border: 'rgba(106,247,200,0.45)',
    bg: 'rgba(106,247,200,0.07)',
    pills: ['100 KB', '1 MB', '5 MB', 'Custom'],
    bullets: [
      { icon: '📑', label: 'Reorder pages freely' },
      { icon: '🎚️', label: 'Smart JPEG compression' },
      { icon: '📤', label: 'Share or save instantly' },
    ],
  },
];

// ─────────────────────────────────────────────
// Single animated card
// ─────────────────────────────────────────────
function FeatureCard({
  card,
  index,
}: {
  card: (typeof CARDS)[0];
  index: number;
}) {
  const nav = useNavigation<any>();

  // entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(48)).current;

  // press animation
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        delay: index * 140,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        delay: index * 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.965,
      useNativeDriver: true,
      tension: 250,
      friction: 10,
    }).start();

  const onPressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 250,
      friction: 10,
    }).start();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: pressScale }],
        marginBottom: SPACING.md,
        marginHorizontal: SPACING.md,
      }}
    >
      {/* Shadow glow layer */}
      <View style={[styles.glowLayer, { backgroundColor: card.glow }]} />

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => nav.navigate(card.route)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.card,
          { borderColor: card.border, backgroundColor: COLORS.card },
        ]}
      >
        {/* Top accent strip */}
        <View style={[styles.topStrip, { backgroundColor: card.accent }]} />

        {/* Header row */}
        <View style={styles.cardHeader}>
          {/* Icon circle */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: card.bg, borderColor: card.border },
            ]}
          >
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
          </View>

          {/* Badge + arrow */}
          <View style={styles.headerRight}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: card.bg, borderColor: card.border },
              ]}
            >
              <Text style={[styles.badgeTxt, { color: card.accent }]}>
                {card.badge}
              </Text>
            </View>
            <View style={[styles.arrowCircle, { borderColor: card.border }]}>
              <Text style={[styles.arrowTxt, { color: card.accent }]}>›</Text>
            </View>
          </View>
        </View>

        {/* Title block */}
        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={[styles.cardSubtitle, { color: card.accent }]}>
          {card.subtitle}
        </Text>

        {/* Description */}
        <Text style={styles.cardDesc}>{card.desc}</Text>

        {/* Separator */}
        <View style={[styles.sep, { backgroundColor: card.border }]} />

        {/* Bullet features */}
        <View style={styles.bulletList}>
          {card.bullets.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <View
                style={[styles.bulletDot, { backgroundColor: card.accent }]}
              />
              <Text style={styles.bulletIcon}>{b.icon}</Text>
              <Text style={styles.bulletLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* Pills */}
        <View style={styles.pillRow}>
          {card.pills.map(p => (
            <View
              key={p}
              style={[
                styles.pill,
                { backgroundColor: card.bg, borderColor: card.border },
              ]}
            >
              <Text style={[styles.pillTxt, { color: card.accent }]}>{p}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View
          style={[
            styles.cta,
            { backgroundColor: card.bg, borderColor: card.border },
          ]}
        >
          <Text style={[styles.ctaTxt, { color: card.accent }]}>
            Open {card.title}
          </Text>
          <Text style={[styles.ctaArrow, { color: card.accent }]}>→</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function Convert({ navigation }: any) {
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <Header navigation={navigation} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerFade, transform: [{ translateY: headerSlide }] },
          ]}
        >
          {/* Brand row */}
          <View style={styles.brandRow}>
            <View style={styles.brandPulse} />
            <Text style={styles.brandTxt}>IMAGE STUDIO PRO</Text>
          </View>

          {/* Hero text */}
          <Text style={styles.heroTitle}>Your Complete{'\n'}Image Toolkit</Text>
          <Text style={styles.heroSub}>
            Convert · Compress · Resize — 100% on-device
          </Text>

          {/* Stat chips */}
          <View style={styles.chipRow}>
            {[
              { icon: '🔄', txt: '4 Formats' },
              { icon: '📄', txt: 'PDF Build' },
              { icon: '🗜️', txt: '95% Compress' },
              { icon: '🔒', txt: 'Private' },
            ].map(c => (
              <View key={c.txt} style={styles.statChip}>
                <Text style={styles.statChipIcon}>{c.icon}</Text>
                <Text style={styles.statChipTxt}>{c.txt}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Section heading ─────────────────────────────── */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTxt}>CHOOSE A TOOL</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* ── 3 Feature Cards ─────────────────────────────── */}
        {CARDS.map((card, i) => (
          <FeatureCard key={card.route} card={card} index={i} />
        ))}

        {/* ── Privacy footer ──────────────────────────────── */}
        <View style={styles.footerCard}>
          <Text style={styles.footerIcon}>🔒</Text>
          <Text style={styles.footerTxt}>
            Everything runs locally. No data is sent to any server.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 90 },

  // Header
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 58 : 42,
    paddingBottom: SPACING.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  brandPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  brandTxt: {
    fontSize: 10,
    fontFamily: 'Courier New',
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 3.5,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 40,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Courier New',
    lineHeight: 19,
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  statChipIcon: { fontSize: 13 },
  statChipTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
    fontFamily: 'Courier New',
  },

  // Section heading
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: 12,
  },
  sectionTxt: {
    fontSize: 10,
    fontFamily: 'Courier New',
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 3,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },

  // Card
  glowLayer: {
    position: 'absolute',
    top: 16,
    left: 32,
    right: 32,
    height: 50,
    borderRadius: RADIUS.xl,
    opacity: 0.7,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  // Accent strip at top of card
  topStrip: {
    height: 3,
    width: '100%',
    opacity: 0.85,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.md,
    paddingBottom: 10,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 30 },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badgePill: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTxt: {
    fontSize: 9,
    fontFamily: 'Courier New',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  arrowTxt: { fontSize: 22, fontWeight: '700', lineHeight: 28 },

  // Text
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
    paddingHorizontal: SPACING.md,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Courier New',
    fontWeight: '700',
    paddingHorizontal: SPACING.md,
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
    marginBottom: 14,
  },

  sep: {
    height: 1,
    marginHorizontal: SPACING.md,
    marginBottom: 14,
    opacity: 0.5,
  },

  // Bullets
  bulletList: {
    paddingHorizontal: SPACING.md,
    gap: 9,
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.8,
  },
  bulletIcon: { fontSize: 14, width: 20 },
  bulletLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: SPACING.md,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  pillTxt: {
    fontSize: 11,
    fontFamily: 'Courier New',
    fontWeight: '700',
  },

  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: SPACING.md,
    marginTop: 0,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
  },
  ctaTxt: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ctaArrow: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Footer
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SPACING.md,
    marginTop: 4,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footerIcon: { fontSize: 16 },
  footerTxt: {
    flex: 1,
    fontSize: 12,
    color: COLORS.muted,
    fontFamily: 'Courier New',
    lineHeight: 17,
  },
});
