// src/components/ResultItem.tsx
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {COLORS, RADIUS, SPACING} from '../utils/theme';
import {formatBytes} from '../utils/converter';

interface Props {
  name: string;
  size: number;
  type: 'image' | 'pdf';
  onShare: () => void;
  onSave: () => void;
}

export default function ResultItem({name, size, type, onShare, onSave}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{type === 'pdf' ? '📄' : '🖼️'}</Text>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta}>{formatBytes(size)}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={onSave} activeOpacity={0.7}>
        <Text style={styles.btnTxt}>↓ Save</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.shareBtn]}
        onPress={onShare}
        activeOpacity={0.7}>
        <Text style={[styles.btnTxt, {color: COLORS.accent}]}>⬆ Share</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  icon: {fontSize: 20},
  info: {flex: 1},
  name: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: 'Courier New',
    fontWeight: '500',
  },
  meta: {
    color: COLORS.muted,
    fontSize: 10,
    fontFamily: 'Courier New',
    marginTop: 2,
  },
  btn: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  shareBtn: {
    backgroundColor: 'rgba(124,106,247,0.12)',
  },
  btnTxt: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Courier New',
  },
});