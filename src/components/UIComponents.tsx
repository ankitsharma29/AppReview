// src/components/UIComponents.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, RADIUS,SPACING } from '../utils/theme';

// ── Gradient-look Button ──────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'success' | 'outline';
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: ButtonProps) {
  const bg =
    variant === 'success'
      ? COLORS.success
      : variant === 'outline'
      ? 'transparent'
      : COLORS.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: COLORS.accent,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={COLORS.white} size="small" />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'outline' && {color: COLORS.accent},
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────
export function ProgressBar({value}: {value: number}) {
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, {width: `${value}%`}]} />
    </View>
  );
}

// ── Format Chip ───────────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FormatChip({label, selected, onPress}: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected && {
          backgroundColor: 'rgba(106,247,200,0.12)',
          borderColor: COLORS.accent3,
        },
      ]}>
      <Text style={[styles.chipText, selected && {color: COLORS.accent3}]}>
        .{label.toLowerCase()}
      </Text>
    </TouchableOpacity>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────
interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({value, onChange}: ToggleProps) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
      style={[styles.toggle, value && {backgroundColor: COLORS.accent}]}>
      <View
        style={[styles.toggleThumb, value && {transform: [{translateX: 20}]}]}
      />
    </TouchableOpacity>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────
interface StatCardProps {
  value: number | string;
  label: string;
}

export function StatCard({value, label}: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Section Label ─────────────────────────────────────────────────
export function SectionLabel({text}: {text: string}) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

// ── Status Badge ──────────────────────────────────────────────────
const STATUS_MAP = {
  ready: {bg: 'rgba(106,247,200,0.15)', color: COLORS.accent3, text: 'Ready'},
  converting: {bg: 'rgba(124,106,247,0.15)', color: COLORS.accent, text: '↻ Converting'},
  done: {bg: 'rgba(74,222,128,0.15)', color: COLORS.success, text: '✓ Done'},
  error: {bg: 'rgba(248,113,113,0.15)', color: COLORS.error, text: '✕ Error'},
};

export function StatusBadge({status}: {status: keyof typeof STATUS_MAP}) {
  const s = STATUS_MAP[status];
  return (
    <View style={[styles.badge, {backgroundColor: s.bg}]}>
      <Text style={[styles.badgeText, {color: s.color}]}>{s.text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  progressBg: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  chipText: {
    color: COLORS.muted,
    fontSize: 13,
    fontFamily: 'Courier New',
    fontWeight: '500',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.accent,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontFamily: 'Courier New',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 3,
  },
  sectionLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontFamily: 'Courier New',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Courier New',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});