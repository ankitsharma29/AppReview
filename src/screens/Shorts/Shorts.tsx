import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorageServices from '../../helper/asyncStorageServices';
import Header from '../../components/Header';
import Colors from '../../resource/theme/color';

const { height, width } = Dimensions.get('window');

const Shorts = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await AsyncStorageServices.getItem('urlHistory');
    if (data) {
      const parsed = JSON.parse(data);
      setHistory(parsed);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const renderItem = useCallback(
    ({ item, index }) => (
      <View style={styles.slide}>
        <WebView
          source={{ uri: item }}
          style={{ flex: 1 }}
          startInLoadingState
          // Only render WebView for current ± 1 to save memory
          renderToHardwareTextureAndroid={Math.abs(index - currentIndex) <= 1}
        />
        {/* <View style={styles.urlBadge}>
          <Text numberOfLines={1} style={styles.urlBadgeText}>
            {item}
          </Text>
        </View> */}
      </View>
    ),
    [currentIndex]
  );

  return (
    <View style={styles.container}>
      {/* <Header title="History" navigation={navigation} /> */}

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No history found</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={renderItem}
          pagingEnabled                          // Snap each URL to full screen
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: height - 60,                 // 60 = Header height
            offset: (height - 60) * index,
            index,
          })}
          initialScrollIndex={0}                 // Auto-select first URL
          maxToRenderPerBatch={2}
          windowSize={3}
        />
      )}
    </View>
  );
};

export default Shorts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white(),
  },
  slide: {
    height: height - 60,   // Full screen minus header
    width: width,
  },
  urlBadge: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urlBadgeText: {
    color: '#fff',
    fontSize: 12,
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
});