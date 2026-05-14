import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ToastAndroid,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorageServices from '../../helper/asyncStorageServices';
import Colors from '../../resource/theme/color';
import Header from '../../components/Header';
import { Copy, Delete } from '../../assets/constant';
import Fonts from '../../resource/theme/font';
import { interstitial } from '../../components/Ads/adMethods';
import { useIsFocused } from '@react-navigation/native';

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
  error: '#F87171',
  white: '#FFFFFF',
};

// ─────────────────────────────────────────────
// Animated history card
// ─────────────────────────────────────────────
const HistoryCard = ({
  item,
  index,
  onCopy,
  onDelete,
}: {
  item: string;
  index: number;
  onCopy: (url: string) => void;
  onDelete: (index: number) => void;
}) => {
  const fadeY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeY, {
        toValue: 0,
        duration: 380,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: fadeY }] }}>
      <View style={styles.card}>
        {/* index badge */}
        <View style={styles.indexBadge}>
          <Text style={styles.indexTxt}>{index + 1}</Text>
        </View>

        {/* URL text */}
        <Text style={styles.url} numberOfLines={1}>
          {item}
        </Text>

        {/* action buttons */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => onCopy(item)}
            activeOpacity={0.75}
          >
            <Copy  />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(index)}
            activeOpacity={0.75}
          >
            <Delete  />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
const EmptyState = () => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.emptyWrap}>
      <Animated.View
        style={[styles.emptyCircle, { transform: [{ scale: pulse }] }]}
      >
        <Text style={styles.emptyEmoji}>🕐</Text>
      </Animated.View>
      <Text style={styles.emptyTitle}>No History Yet</Text>
      <Text style={styles.emptySubtitle}>URLs you visit will appear here</Text>
    </View>
  );
};

// ─────────────────────────────────────────────
// Main Screen — ALL original logic preserved
// ─────────────────────────────────────────────
const HistoryScreen = ({ navigation }: any) => {
  const [history, setHistory] = useState([]);
  const isFocused = useIsFocused();

  // ── original logic (unchanged) ─────────────
  useEffect(() => {
    interstitial.load();
  }, [isFocused]);

  useEffect(() => {
    try {
      setTimeout(() => {
        if (isFocused === true) {
          (async () => {
            await interstitial.show();
          })();
        }
      }, 5000);
    } catch (error) {}
  }, [isFocused]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await AsyncStorageServices.getItem('urlHistory');
    if (data) {
      setHistory(JSON.parse(data));
    }
  };

  const deleteItem = async (index: number) => {
    let newHistory = [...history];
    newHistory.splice(index, 1);
    setHistory(newHistory);
    await AsyncStorageServices.setItem(
      'urlHistory',
      JSON.stringify(newHistory),
    );
    ToastAndroid.showWithGravity(
      'Deleted item',
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
    );
  };

  const clearHistory = async () => {
    Alert.alert('Clear History', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          await AsyncStorageServices.removeItem('urlHistory');
          setHistory([]);
        },
      },
    ]);
  };

  const copyUrl = (url: string) => {
    Clipboard.setString(url);
    ToastAndroid.showWithGravity(
      'URL Copied',
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
    );
  };
  // ── end original logic ──────────────────────

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <HistoryCard
      item={item}
      index={index}
      onCopy={copyUrl}
      onDelete={deleteItem}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />

      {/* original Header component — unchanged */}
      <Header title={'History'} navigation={navigation} />

      {/* ── count badge ── */}
      {history.length > 0 && (
        <View style={styles.countRow}>
          <View style={styles.countBadge}>
            <View style={styles.countDot} />
            <Text style={styles.countTxt}>
              {history.length} saved URL{history.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

      {/* ── list ── */}
      <FlatList
        data={history}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />

      {/* ── clear all button ── */}
      {history.length > 0 && (
        <View style={styles.clearWrap}>
          <TouchableOpacity
            onPress={clearHistory}
            style={styles.clearBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.clearIcon}>🗑️</Text>
            <Text style={styles.clearTxt}>Clear All History</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default HistoryScreen;

// ─────────────────────────────────────────────
// Styles — dark modern redesign
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: D.bg,
  },

  // count badge
  countRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    backgroundColor: 'rgba(124,106,247,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.28)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: D.accent,
  },
  countTxt: {
    fontSize: 11,
    fontFamily: Fonts.poppinsSemiBold,
    color: D.accent,
    letterSpacing: 0.5,
  },

  // list
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },

  // card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: D.card,
    borderWidth: 1,
    borderColor: D.border,
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(124,106,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexTxt: {
    fontSize: 11,
    fontFamily: Fonts.poppinsSemiBold,
    color: D.accent,
  },
  url: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.poppinsRegular,
    color: D.text,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(124,106,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(247,106,138,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(247,106,138,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(124,106,247,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(124,106,247,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyEmoji: { fontSize: 38 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.poppinsSemiBold,
    color: D.text,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
  },

  // clear all
  clearWrap: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: D.border,
    backgroundColor: D.bg,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(248,113,113,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(248,113,113,0.30)',
    borderRadius: 12,
    paddingVertical: 13,
  },
  clearIcon: { fontSize: 16 },
  clearTxt: {
    fontSize: 14,
    fontFamily: Fonts.poppinsSemiBold,
    color: D.error,
    letterSpacing: 0.3,
  },

  // kept for backward compat (unused but harmless)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  btnText: { color: D.white, fontWeight: 'bold' },
  copyBtnOld: { backgroundColor: 'green', padding: 8, borderRadius: 5 },
  deleteBtnOld: { padding: 8, borderRadius: 5 },
  empty: { textAlign: 'center', marginTop: 50, fontSize: 16, color: D.muted },
});
