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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorageServices from '../../helper/asyncStorageServices';
import Header from '../../components/Header';
import Colors from '../../resource/theme/color';
import Fonts from '../../resource/theme/font';
import Mixins from '../../resource/mixins/appStyle';
import { useIsFocused } from '@react-navigation/native';
import { interstitial } from '../../components/Ads/adMethods';

const { height, width } = Dimensions.get('window');
const { scaleFont, scaleSize } = Mixins;

const Shorts = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  // ✅ Full usable height = screen - statusbar - bottom tab - safe area
  const BOTTOM_TAB_HEIGHT = 65; // Apne tab bar ki height yahan dalo
  const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0;
  const SLIDE_HEIGHT = height - STATUS_BAR_HEIGHT - BOTTOM_TAB_HEIGHT - insets.bottom;

  useEffect(() => {
    loadHistory();
  }, [isFocused]);

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
      // ✅ SLIDE_HEIGHT use ho raha hai har item mein
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

  // Ads
  useEffect(() => {
    interstitial.load();
  }, [isFocused]);

  useEffect(() => {
    try {
      setTimeout(() => {
        if (isFocused) {
          (async () => {
            await interstitial.show();
          })();
        }
      }, 5000);
    } catch (error) {}
  }, [isFocused]);

  return (
    // ✅ StatusBar transparent + edges se content sahi position mein aaye
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No history found</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              navigation.navigate('PageWindow', {
                item: {
                  title: 'Get More Views In Multiple Tab',
                  des: '*Your Video Must Be Longer Than one Minute',
                  screen: 'PageWindow',
                  flag: 'oneMinute',
                },
              });
            }}
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
          // ✅ getItemLayout mein bhi same SLIDE_HEIGHT
          getItemLayout={(_, index) => ({
            length: SLIDE_HEIGHT,
            offset: SLIDE_HEIGHT * index,
            index,
          })}
          initialScrollIndex={0}
          maxToRenderPerBatch={2}
          windowSize={3}
          decelerationRate="fast"  // ✅ Smooth snap scrolling
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
    width: width,
    // height yahan nahi — renderItem mein dynamically set hoti hai
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
    width: 100,
    padding: scaleSize(10),
    backgroundColor: Colors.black(),
    alignItems: 'center',
    borderRadius: 5,
  },
  textStyle: {
    fontSize: 18,
    fontFamily: Fonts.poppinsRegular,
    color: Colors.white(),
    fontWeight: '400',
    textAlign: 'center',
    padding: scaleSize(5),
  },
});