// ============================================================
//  Shorts.jsx  —  Paginated + Randomized Firebase feed
//
//  Pagination strategy:
//    - First PAGE_SIZE (10) URLs load on mount
//    - When user reaches 3 slides from the end → load next page
//    - New batch is Fisher-Yates shuffled and appended
//    - Shows footer spinner while loading more
//    - "No more shorts" footer when list exhausted
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
  fetchShortsPage,
  shuffleArray,
} from '../../firebase/firebaseService';      // adjust path as needed

import { interstitial } from '../../components/Ads/adMethods';
import Colors from '../../resource/theme/color';
import Fonts from '../../resource/theme/font';
import Mixins from '../../resource/mixins/appStyle';

const { height, width } = Dimensions.get('window');
const { scaleSize } = Mixins;

const BOTTOM_TAB_HEIGHT  = 65;
const STATUS_BAR_HEIGHT  =
  Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0;
const LOAD_MORE_THRESHOLD = 3;   // load next page when 3 slides remain

// ─────────────────────────────────────────────
const Shorts = ({ navigation }) => {
  const [history, setHistory]           = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Pagination state
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore]       = useState(false);
  const [hasMore, setHasMore]               = useState(true);
  const lastDocRef  = useRef(null);    // Firestore cursor
  const isFetching  = useRef(false);   // prevent duplicate calls

  // Add-URL modal
  const [modalVisible, setModalVisible] = useState(false);
  const [inputUrl, setInputUrl]         = useState('');
  const [adding, setAdding]             = useState(false);

  const isFocused   = useIsFocused();
  const insets      = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const SLIDE_HEIGHT =
    height - STATUS_BAR_HEIGHT - BOTTOM_TAB_HEIGHT - insets.bottom;

  // ─── Load first page on mount ─────────────
  useEffect(() => {
    loadFirstPage();
  }, []);

  const loadFirstPage = async () => {
    try {
      setInitialLoading(true);
      isFetching.current = true;

      const { urls, lastDoc, hasMore: more } = await fetchShortsPage(null);

      lastDocRef.current = lastDoc;
      setHistory(urls);
      setHasMore(more);
    } catch (err) {
      console.error('loadFirstPage error:', err);
      Alert.alert('Error', 'Failed to load shorts.');
    } finally {
      setInitialLoading(false);
      isFetching.current = false;
    }
  };

  // ─── Load next page (called near end of list) ─
  const loadNextPage = useCallback(async () => {
    if (isFetching.current || !hasMore || !lastDocRef.current) return;

    try {
      isFetching.current = true;
      setLoadingMore(true);

      const { urls, lastDoc, hasMore: more } =
        await fetchShortsPage(lastDocRef.current);

      lastDocRef.current = lastDoc;
      setHistory((prev) => [...prev, ...urls]);   // append new batch
      setHasMore(more);

      console.log('[Shorts] Loaded more:', urls.length, '| hasMore:', more);
    } catch (err) {
      console.error('loadNextPage error:', err);
    } finally {
      setLoadingMore(false);
      isFetching.current = false;
    }
  }, [hasMore]);

  // ─── Trigger load more when near end ──────
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length === 0) return;

    const index = viewableItems[0].index ?? 0;
    setCurrentIndex(index);

    // When user is LOAD_MORE_THRESHOLD slides from the end, fetch next page
    const distanceFromEnd = history.length - 1 - index;
    if (distanceFromEnd <= LOAD_MORE_THRESHOLD) {
      loadNextPage();
    }
  }).current;

  // ─── Manual reshuffle ─────────────────────
  const reshuffleList = useCallback(() => {
    if (history.length === 0) return;
    setHistory((prev) => shuffleArray(prev));
    setCurrentIndex(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
  }, [history]);

  // ─── Add URL to Firebase ──────────────────
  const handleAddUrl = useCallback(async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }
    try {
      setAdding(true);
      await addShortsUrl(trimmed);
      setInputUrl('');
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to add URL. Try again.');
    } finally {
      setAdding(false);
    }
  }, [inputUrl]);

  // ─── FlatList helpers ─────────────────────
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

  // ─── Footer: spinner or "end of list" ─────
  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={[styles.footer, { height: SLIDE_HEIGHT }]}>
          <ActivityIndicator size="large" color={Colors.black()} />
          <Text style={styles.footerText}>Loading more shorts...</Text>
        </View>
      );
    }
    if (!hasMore && history.length > 0) {
      return (
        <View style={[styles.footer, { height: SLIDE_HEIGHT / 2 }]}>
          <Text style={styles.endText}>✓ All shorts loaded</Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={reshuffleList}>
            <Text style={styles.reloadText}>🔀 Shuffle Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }, [loadingMore, hasMore, history.length, SLIDE_HEIGHT, reshuffleList]);

  // ─── Ads ──────────────────────────────────
  useEffect(() => { interstitial.load(); }, [isFocused]);
  useEffect(() => {
    try {
      setTimeout(() => {
        if (isFocused) (async () => await interstitial.show())();
      }, 5000);
    } catch (_) {}
  }, [isFocused]);

  // ─── Initial loading screen ───────────────
  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.black()} />
        <Text style={styles.loadingText}>Loading Shorts...</Text>
      </View>
    );
  }

  // ─── Main render ──────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* FAB: Add URL */}
      <TouchableOpacity
        style={[styles.fab, styles.fabAdd]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* FAB: Reshuffle */}
      {history.length > 1 && (
        <TouchableOpacity
          style={[styles.fab, styles.fabShuffle]}
          onPress={reshuffleList}
        >
          <Text style={styles.fabText}>🔀</Text>
        </TouchableOpacity>
      )}

      {/* Empty state */}
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
          ref={flatListRef}
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
          maxToRenderPerBatch={3}
          windowSize={5}
          decelerationRate="fast"
          ListFooterComponent={renderFooter}
          // onEndReached as fallback safety net
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Add URL Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Shorts URL</Text>
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
                onPress={() => { setInputUrl(''); setModalVisible(false); }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.addBtn]}
                onPress={handleAddUrl}
                disabled={adding}
              >
                {adding
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.addText}>Add</Text>
                }
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
  // Footer
  footer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
  },
  endText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  reloadBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderRadius: 20,
  },
  reloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty
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
  // FABs
  fab: {
    position: 'absolute',
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
  fabAdd: {
    bottom: 80,
    right: 20,
  },
  fabShuffle: {
    bottom: 145,
    right: 20,
  },
  fabText: {
    color: Colors.white(),
    fontSize: 22,
    lineHeight: 26,
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
  cancelBtn: { backgroundColor: '#f2f2f2' },
  addBtn:    { backgroundColor: Colors.black() },
  cancelText: { color: '#555', fontWeight: '500' },
  addText:    { color: '#fff', fontWeight: '600' },
});