import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  ListRenderItem,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ShadowRadiusView from '../../components/ShadowRadiusView';
import { customWebTab } from '../../components/customWebTab';
import Mixins from '../../resource/mixins/appStyle';
import Fonts from '../../resource/theme/font';
import Colors from '../../resource/theme/color';
import { getDeviceId } from '../../helper/appUtils';
import Header from '../../components/Header';

type GameListProps = NativeStackScreenProps<any, 'GameList'>;

const { scaleSize, scaleFont } = Mixins;
const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────
const D = {
  bg: '#09090F',
  surface: '#101019',
  card: '#13131F',
  border: '#252538',
  accent: '#7C6AF7',
  pink: '#F76A8A',
  teal: '#6AF7C8',
  yellow: '#FBBF24',
  text: '#F0EEFF',
  muted: '#6B6880',
  white: '#FFFFFF',
};

// card accent colours cycled per item
const ACCENTS = [D.accent, D.pink, D.teal, D.yellow, '#60A5FA', '#34D399'];

// ─────────────────────────────────────────────
// Animated Game Card
// ─────────────────────────────────────────────
const GameCard = ({
  item,
  index,
  cardWidth,
  onPress,
}: {
  item: any;
  index: number;
  cardWidth: number;
  onPress: (item: any) => void;
}) => {
  const accent = ACCENTS[index % ACCENTS.length];
  const fadeY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: (index % 8) * 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeY, {
        toValue: 0,
        duration: 400,
        delay: (index % 8) * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 280,
      friction: 10,
    }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 280,
      friction: 10,
    }).start();

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          width: cardWidth,
          opacity,
          transform: [{ translateY: fadeY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(item)}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.card, { borderColor: accent + '40' }]}
      >
        {/* top accent strip */}
        <View style={[styles.cardStrip, { backgroundColor: accent }]} />

        {/* game cover image */}
        <View style={styles.imageWrap}>
          <Image
            style={styles.image}
            source={{ uri: item.images?.cover }}
            resizeMode="cover"
          />
          {/* play overlay */}
          <View
            style={[
              styles.playOverlay,
              { backgroundColor: accent + '22', borderColor: accent + '55' },
            ]}
          >
            <Text style={[styles.playIcon, { color: accent }]}>▶</Text>
          </View>
        </View>

        {/* info */}
        <View style={styles.cardInfo}>
          <Text numberOfLines={2} style={styles.title}>
            {item?.name}
          </Text>
          <Text numberOfLines={2} style={styles.subtitle}>
            {item?.description}
          </Text>

          {/* play button */}
          <View
            style={[
              styles.playBtn,
              { backgroundColor: accent + '18', borderColor: accent + '45' },
            ]}
          >
            <Text style={[styles.playBtnTxt, { color: accent }]}>
              Play Now →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────
// Skeleton loader card
// ─────────────────────────────────────────────
const SkeletonCard = ({ cardWidth }: { cardWidth: number }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.cardWrapper, { width: cardWidth, opacity: pulse }]}
    >
      <View style={[styles.card, { borderColor: D.border }]}>
        <View style={[styles.cardStrip, { backgroundColor: D.border }]} />
        <View
          style={[
            styles.image,
            { backgroundColor: D.border, borderRadius: scaleSize(10) },
          ]}
        />
        <View style={styles.cardInfo}>
          <View
            style={[
              styles.skelLine,
              { width: '80%', marginBottom: scaleSize(8) },
            ]}
          />
          <View
            style={[
              styles.skelLine,
              { width: '60%', marginBottom: scaleSize(6) },
            ]}
          />
          <View style={[styles.skelLine, { width: '40%' }]} />
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
          toValue: 1.06,
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
        <Text style={styles.emptyEmoji}>🎮</Text>
      </Animated.View>
      <Text style={styles.emptyTitle}>Loading Games…</Text>
      <Text style={styles.emptySub}>Hang tight while we fetch the list</Text>
    </View>
  );
};

// ─────────────────────────────────────────────
// Main Screen — ALL original logic preserved
// ─────────────────────────────────────────────
const GameList = ({ navigation }: GameListProps) => {
  const [dimensions, setDimensions] = useState<any>({ width: 0, height: 0 });
  const [GameListState, setGameList] = useState<any>([]);
  const [GameListData, setGameListData] = useState<any>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchGameData();
  }, []);

  // ── original logic (unchanged) ─────────────
  const fetchGameData = async () => {
    try {
      fetch('https://api.gamezop.com/v3/games', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ff1ad137-8cc5-4b41-a277-0fd61a284f74',
        },
      })
        .then(res => res.json())
        .then(response => {
          setGameList(response?.data);
          setGameListData(response?.data);
        });
    } catch (error) {}
  };

  const keyExtractor = (_item: any, index: number) => `ListItem_${index}`;

  const ItemSeparatorComponent = () => <View style={styles.separator} />;

  const onGameItemPress = async (item: any) => {
    const userId = await getDeviceId();
    console.log("item",item);
    
    customWebTab(`${item.url}?sub=${userId}`).then(res =>
      console.log('res', res),
    );
  };

  const onListLayout = (event: any) => {
    if (dimensions.width === 0 && dimensions.height === 0) {
      setDimensions({
        width: event.nativeEvent.layout.width,
        height: event.nativeEvent.layout.height,
      });
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    fetchGameData();
    setRefreshing(false);
  }, []);
  // ── end original logic ──────────────────────

  const listWidth = dimensions.width || SCREEN_W;
  const GAP = scaleSize(10);
  const H_PAD = scaleSize(12);
  const cardWidth = (listWidth - H_PAD * 2 - GAP) / 2;

  const renderListItem: ListRenderItem<any> = ({ item, index }) => (
    <GameCard
      item={item}
      index={index}
      cardWidth={cardWidth}
      onPress={onGameItemPress}
    />
  );

  // show skeletons while loading
  const isLoading = GameListState.length === 0 && !refreshing;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />

      {/* original Header component — unchanged */}
      <Header
        title={'Games List'}
        navigation={navigation}
        historyButton={false}
      />

      {/* ── count + search row ── */}
      {GameListState.length > 0 && (
        <View style={styles.topRow}>
          <View style={styles.countBadge}>
            <View style={styles.countDot} />
            <Text style={styles.countTxt}>{GameListState.length} Games</Text>
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>LIVE</Text>
          </View>
        </View>
      )}

      {/* ── skeleton loading ── */}
      {isLoading ? (
        <FlatList
          data={Array(6).fill(null)}
          numColumns={2}
          contentContainerStyle={[
            styles.listContainerStyle,
            { paddingHorizontal: H_PAD },
          ]}
          renderItem={() => <SkeletonCard cardWidth={cardWidth} />}
          keyExtractor={(_, i) => `skel_${i}`}
          ItemSeparatorComponent={ItemSeparatorComponent}
          columnWrapperStyle={{ gap: GAP }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={GameListState ?? []}
          numColumns={2}
          contentContainerStyle={[
            styles.listContainerStyle,
            { paddingHorizontal: H_PAD },
          ]}
          renderItem={renderListItem}
          keyExtractor={keyExtractor}
          onLayout={onListLayout}
          ItemSeparatorComponent={ItemSeparatorComponent}
          columnWrapperStyle={{ gap: GAP }}
          onEndReachedThreshold={0.2}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={D.accent}
              colors={[D.accent]}
            />
          }
        />
      )}
    </View>
  );
};

export default GameList;

// ─────────────────────────────────────────────
// Styles — dark modern redesign
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: D.bg,
  },

  // top count row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSize(14),
    paddingTop: scaleSize(12),
    paddingBottom: scaleSize(4),
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(7),
    backgroundColor: 'rgba(124,106,247,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.28)',
    borderRadius: scaleSize(999),
    paddingHorizontal: scaleSize(12),
    paddingVertical: scaleSize(5),
  },
  countDot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: D.accent,
  },
  countTxt: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.accent,
    letterSpacing: 0.5,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(5),
    backgroundColor: 'rgba(106,247,200,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(106,247,200,0.28)',
    borderRadius: scaleSize(999),
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(5),
  },
  liveDot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: '#6AF7C8',
  },
  liveTxt: {
    fontSize: scaleFont(10),
    fontFamily: Fonts.poppinsSemiBold,
    color: '#6AF7C8',
    letterSpacing: 1.5,
  },

  // list
  listContainerStyle: {
    paddingTop: scaleSize(12),
    paddingBottom: scaleSize(40),
  },
  separator: {
    height: scaleSize(10),
  },

  // card
  cardWrapper: {
    overflow: 'visible',
  },
  card: {
    backgroundColor: D.card,
    borderWidth: 1.5,
    borderRadius: scaleSize(16),
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: scaleSize(10),
  },
  cardStrip: {
    height: scaleSize(3),
    width: '100%',
  },
  imageWrap: {
    position: 'relative',
    margin: scaleSize(10),
    marginBottom: scaleSize(6),
    borderRadius: scaleSize(10),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: scaleSize(110),
    borderRadius: scaleSize(10),
    backgroundColor: D.surface,
  },
  playOverlay: {
    position: 'absolute',
    bottom: scaleSize(6),
    right: scaleSize(6),
    width: scaleSize(28),
    height: scaleSize(28),
    borderRadius: scaleSize(14),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: scaleFont(11),
    fontWeight: '700',
  },
  cardInfo: {
    paddingHorizontal: scaleSize(10),
    paddingBottom: scaleSize(10),
    gap: scaleSize(4),
  },
  title: {
    fontFamily: Fonts.poppinsSemiBold,
    fontSize: scaleFont(13),
    color: D.text,
    lineHeight: scaleSize(18),
  },
  subtitle: {
    fontFamily: Fonts.poppinsRegular,
    fontSize: scaleFont(11),
    color: D.muted,
    lineHeight: scaleSize(16),
  },
  playBtn: {
    marginTop: scaleSize(6),
    borderWidth: 1,
    borderRadius: scaleSize(8),
    paddingVertical: scaleSize(6),
    alignItems: 'center',
  },
  playBtnTxt: {
    fontSize: scaleFont(11),
    fontFamily: Fonts.poppinsSemiBold,
    letterSpacing: 0.3,
  },

  // skeleton
  skelLine: {
    height: scaleSize(10),
    backgroundColor: D.border,
    borderRadius: scaleSize(5),
  },

  // empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scaleSize(80),
    gap: scaleSize(12),
  },
  emptyCircle: {
    width: scaleSize(90),
    height: scaleSize(90),
    borderRadius: scaleSize(45),
    backgroundColor: 'rgba(124,106,247,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(124,106,247,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(8),
  },
  emptyEmoji: { fontSize: scaleFont(36) },
  emptyTitle: {
    fontSize: scaleFont(17),
    fontFamily: Fonts.poppinsSemiBold,
    color: D.text,
  },
  emptySub: {
    fontSize: scaleFont(12),
    fontFamily: Fonts.poppinsRegular,
    color: D.muted,
  },

  // kept for compat
  noListView: {
    padding: scaleSize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTransactionView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(20),
  },
  noTransactionTxt: {
    marginTop: scaleSize(35),
    fontSize: scaleFont(18),
    fontFamily: Fonts.poppinsMedium,
    color: D.white,
  },
  GameRating: { flexDirection: 'row', alignItems: 'center' },
  Rating: {
    fontFamily: Fonts.poppinsMedium,
    fontSize: scaleFont(16),
    color: D.white,
  },
});
