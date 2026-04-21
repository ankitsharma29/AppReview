// src/components/ImageCard.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {ImageFile, formatBytes, getExtension} from '../utils/converter';
import {StatusBadge} from '../components/UIComponents';
import {COLORS, RADIUS, SPACING} from '../utils/theme';

interface Props {
  item: ImageFile;
  onRemove: (id: string) => void;
  onDownload?: (item: ImageFile) => void;
}

export default function ImageCard({item, onRemove, onDownload}: Props) {
  return (
    <View style={styles.card}>
      <Image source={{uri: item.uri}} style={styles.thumb} resizeMode="cover" />

      {/* Top overlay */}
      <View style={styles.topRow}>
        <StatusBadge status={item.status} />
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(item.id)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.removeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta}>
          {formatBytes(item.size)} · {getExtension(item.name)}
        </Text>
      </View>

      {/* Download button when done */}
      {item.status === 'done' && item.outputUri && onDownload && (
        <TouchableOpacity
          style={styles.dlBtn}
          onPress={() => onDownload(item)}
          activeOpacity={0.7}>
          <Text style={styles.dlTxt}>↓ Save</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 10,
  },
  thumb: {
    width: '100%',
    height: 110,
  },
  topRow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTxt: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: 8,
  },
  name: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  meta: {
    color: COLORS.muted,
    fontSize: 10,
    fontFamily: 'Courier New',
  },
  dlBtn: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    padding: 7,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dlTxt: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Courier New',
  },
});