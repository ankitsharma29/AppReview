// ============================================================
//  Shorts.jsx  —  Firebase integrated version
// ============================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import {
  addShortsUrl,
  subscribeShortsUrls, // real-time listener — swaps with fetchShortsUrls if preferred
} from '../../firebase/firebaseService'; // ← adjust path as needed

import { interstitial } from '../../components/Ads/adMethods';
import Colors from '../../resource/theme/color';
import Fonts from '../../resource/theme/font';
import Mixins from '../../resource/mixins/appStyle';

const { height, width } = Dimensions.get('window');
const { scaleFont, scaleSize } = Mixins;

const BOTTOM_TAB_HEIGHT = 65;
const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0;

// ─────────────────────────────────────────────
const Shorts = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add-URL modal
  const [modalVisible, setModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const SLIDE_HEIGHT =
    height - STATUS_BAR_HEIGHT - BOTTOM_TAB_HEIGHT - insets.bottom;

  // ─── Firebase real-time subscription ──────
  useEffect(() => {
    setLoading(true);

    // subscribeShortsUrls returns unsubscribe fn
    const unsubscribe = subscribeShortsUrls(urls => {
      setHistory(urls);
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  // ─── Add URL to Firebase ──────────────────
  const handleAddUrl = useCallback(async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      setAdding(true);
      await addShortsUrl(trimmed); // saves to Firestore
      setInputUrl('');
      setModalVisible(false);
      // subscribeShortsUrls listener auto-updates history ✅
    } catch (err) {
      Alert.alert('Error', 'Failed to add URL. Try again.');
      console.error(err);
    } finally {
      setAdding(false);
    }
  }, [inputUrl]);

  // ─── FlatList helpers ─────────────────────
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={[styles.slide, { height: SLIDE_HEIGHT }]}>
        <WebView
          source={{ uri: item }}
          style={{ flex: 1 }}
          startInLoadingState
          renderToHardwareTextureAndroid={Math.abs(index - currentIndex) <= 1}
        />
      </View>
    ),
    [currentIndex, SLIDE_HEIGHT],
  );

  // ─── Ads ──────────────────────────────────
  useEffect(() => {
    interstitial.load();
  }, [isFocused]);

  useEffect(() => {
    try {
      setTimeout(() => {
        if (isFocused) {
          (async () => await interstitial.show())();
        }
      }, 5000);
    } catch (_) {}
  }, [isFocused]);

  // ─── Render ───────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.black()} />
        <Text style={styles.loadingText}>Loading Shorts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* ── Add URL FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* ── Empty state ── */}
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No shorts found</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate('PageWindow', {
                item: {
                  title: 'Get More Views In Multiple Tab',
                  des: '*Your Video Must Be Longer Than one Minute',
                  screen: 'PageWindow',
                  flag: 'oneMinute',
                },
              })
            }
          >
            <Text style={styles.textStyle}>Browser Screen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: SLIDE_HEIGHT,
            offset: SLIDE_HEIGHT * index,
            index,
          })}
          initialScrollIndex={0}
          maxToRenderPerBatch={2}
          windowSize={3}
          decelerationRate="fast"
        />
      )}

      {/* ── Add URL Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Shorts URL for Free Sponsorship</Text>
            <TextInput
              style={styles.input}
              placeholder="https://youtube.com/shorts/..."
              placeholderTextColor="#aaa"
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setInputUrl('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.addBtn]}
                onPress={handleAddUrl}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Shorts;

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white(),
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
  },
  slide: {
    width,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  button: {
    marginTop: scaleSize(10),
    width: 120,
    padding: scaleSize(10),
    backgroundColor: Colors.black(),
    alignItems: 'center',
    borderRadius: 5,
  },
  textStyle: {
    fontSize: 16,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.white(),
    fontWeight: '400',
    textAlign: 'center',
    padding: scaleSize(5),
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 99,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.black(),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: {
    color: Colors.white(),
    fontSize: 28,
    lineHeight: 32,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f2f2f2',
  },
  addBtn: {
    backgroundColor: Colors.black(),
  },
  cancelText: {
    color: '#555',
    fontWeight: '500',
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
  },
});
