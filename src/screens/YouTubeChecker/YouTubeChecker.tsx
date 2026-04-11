import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';

const { width } = Dimensions.get('window');
const API_KEY = 'YOUR_YOUTUBE_API_KEY'; // 🔑 Replace with your key

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatNum = n => {
  if (!n) return '0';
  n = parseInt(n);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};

const extractChannelId = async input => {
  input = input.trim();
  // Direct channel ID
  if (/^UC[\w-]{22}$/.test(input)) return input;
  // youtube.com/channel/UC...
  const chanMatch = input.match(/channel\/(UC[\w-]{22})/);
  if (chanMatch) return chanMatch[1];
  // youtube.com/@handle or youtube.com/c/name or youtube.com/user/name
  const handleMatch = input.match(/(?:@|\/c\/|\/user\/)([^/?&]+)/);
  const handle = handleMatch ? handleMatch[1] : input.replace(/^@/, '');
  // Search by handle
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
      handle,
    )}&key=${API_KEY}`,
  );
  const data = await res.json();
  return data?.items?.[0]?.snippet?.channelId || null;
};

const fetchChannelStats = async channelId => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`,
  );
  const data = await res.json();
  return data?.items?.[0] || null;
};

const fetchRecentVideos = async channelId => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=6&order=date&type=video&key=${API_KEY}`,
  );
  const data = await res.json();
  const ids = data?.items?.map(i => i.id.videoId).join(',');
  if (!ids) return [];
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${ids}&key=${API_KEY}`,
  );
  const statsData = await statsRes.json();
  return statsData?.items || [];
};

// ─── Animated Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ label, value, color, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      delay,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  }, [value]);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const opacity = anim;
  return (
    <Animated.View
      style={[styles.statCard, { transform: [{ scale }], opacity }]}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// ─── Pulse Ring Animation ───────────────────────────────────────────────────
const PulseRing = ({ color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
};

// ─── Traffic Meter Bar ──────────────────────────────────────────────────────
const TrafficBar = ({ label, value, max, color, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(value / max, 1),
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);
  const barW = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 5,
        }}
      >
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barVal, { color }]}>{formatNum(value)}</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, { width: barW, backgroundColor: color }]}
        />
      </View>
    </View>
  );
};

// ─── Video Card ─────────────────────────────────────────────────────────────
const VideoCard = ({ video, index }) => {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);
  const s = video.statistics || {};
  const thumb = video.snippet?.thumbnails?.medium?.url;
  const title = video.snippet?.title || '';
  const views = formatNum(s.viewCount);
  const likes = formatNum(s.likeCount);
  const comments = formatNum(s.commentCount);
  const engRate =
    s.viewCount > 0
      ? (
          (((parseInt(s.likeCount) || 0) + (parseInt(s.commentCount) || 0)) /
            parseInt(s.viewCount)) *
          100
        ).toFixed(2)
      : '0';
  return (
    <Animated.View
      style={[
        styles.videoCard,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      {thumb && (
        <Image
          source={{ uri: thumb }}
          style={styles.thumb}
          resizeMode="cover"
        />
      )}
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.videoStats}>
          <Text style={styles.vStat}>👁 {views}</Text>
          <Text style={styles.vStat}>👍 {likes}</Text>
          <Text style={styles.vStat}>💬 {comments}</Text>
        </View>
        <View style={styles.engBadge}>
          <Text style={styles.engText}>Eng: {engRate}%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Wave Animation ─────────────────────────────────────────────────────────
const WaveLoader = ({ active }) => {
  const bars = useRef(
    Array.from({ length: 16 }, () => new Animated.Value(4)),
  ).current;
  React.useEffect(() => {
    if (!active) {
      bars.forEach(b =>
        Animated.timing(b, {
          toValue: 4,
          duration: 200,
          useNativeDriver: false,
        }).start(),
      );
      return;
    }
    const anims = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 60),
          Animated.timing(bar, {
            toValue: 4 + Math.random() * 28,
            duration: 260,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 4,
            duration: 260,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    const loop = Animated.parallel(anims);
    loop.start();
    return () => loop.stop();
  }, [active]);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
        height: 36,
        justifyContent: 'center',
        marginVertical: 8,
      }}
    >
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            borderRadius: 2,
            height: b,
            backgroundColor: active ? '#FF0000' : '#E5E7EB',
          }}
        />
      ))}
    </View>
  );
};

// ─── Score Ring ─────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: score / 100,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score]);
  const color = score >= 70 ? '#1D9E75' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Average' : 'Low';
  return (
    <View style={styles.scoreWrap}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          width: 110,
          height: 110,
        }}
      >
        <PulseRing color={color} />
        <View style={[styles.scoreCircle, { borderColor: color }]}>
          <Text style={[styles.scoreNum, { color }]}>{score}</Text>
          <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
        </View>
      </View>
      <Text style={styles.scoreTitle}>Channel Health Score</Text>
    </View>
  );
};

// ─── Main App ────────────────────────────────────────────────────────────────
const YouTubeChecker = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [score, setScore] = useState(0);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const calcScore = (stats, vids) => {
    let s = 0;
    const subs = parseInt(stats?.subscriberCount || 0);
    const views = parseInt(stats?.viewCount || 0);
    const count = parseInt(stats?.videoCount || 0);
    if (subs > 1_000_000) s += 30;
    else if (subs > 100_000) s += 22;
    else if (subs > 10_000) s += 14;
    else if (subs > 1_000) s += 7;
    if (views > 100_000_000) s += 25;
    else if (views > 10_000_000) s += 18;
    else if (views > 1_000_000) s += 11;
    else if (views > 100_000) s += 5;
    if (count > 500) s += 15;
    else if (count > 100) s += 10;
    else if (count > 20) s += 5;
    const avgEng =
      vids.reduce((acc, v) => {
        const vc = parseInt(v.statistics?.viewCount || 0);
        const lc = parseInt(v.statistics?.likeCount || 0);
        const cc = parseInt(v.statistics?.commentCount || 0);
        return acc + (vc > 0 ? ((lc + cc) / vc) * 100 : 0);
      }, 0) / (vids.length || 1);
    if (avgEng > 5) s += 20;
    else if (avgEng > 2) s += 13;
    else if (avgEng > 0.5) s += 7;
    if (views > 0 && subs > 0) {
      const ratio = views / subs;
      if (ratio > 100) s += 10;
      else if (ratio > 30) s += 6;
      else if (ratio > 10) s += 3;
    }
    return Math.min(s, 100);
  };

  const runCheck = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setChannel(null);
    setVideos([]);
    setScore(0);
    try {
      setStatus('Finding channel...');
      const channelId = await extractChannelId(input);
      if (!channelId) throw new Error('Channel not found. Check URL or name.');

      setStatus('Fetching channel stats...');
      const ch = await fetchChannelStats(channelId);
      if (!ch) throw new Error('Could not fetch channel data.');
      setChannel(ch);

      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();

      setStatus('Analyzing recent videos...');
      const vids = await fetchRecentVideos(channelId);
      setVideos(vids);

      setStatus('Calculating health score...');
      await sleep(400);
      const s = calcScore(ch.statistics, vids);
      setScore(s);

      setStatus('Done!');
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setLoading(false);
  };

  const stats = channel?.statistics || {};
  const snippet = channel?.snippet || {};
  const avgViews =
    videos.length > 0
      ? Math.round(
          videos.reduce(
            (a, v) => a + parseInt(v.statistics?.viewCount || 0),
            0,
          ) / videos.length,
        )
      : 0;
  const avgLikes =
    videos.length > 0
      ? Math.round(
          videos.reduce(
            (a, v) => a + parseInt(v.statistics?.likeCount || 0),
            0,
          ) / videos.length,
        )
      : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.ytBadge}>
            <Text style={styles.ytBadgeText}>▶</Text>
          </View>
          <Text style={styles.headerTitle}>YouTube Channel Checker</Text>
          <Text style={styles.headerSub}>Analyze traffic, stats & growth</Text>
        </View>

        {/* Search Box */}
        <View style={styles.searchSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Channel URL, @handle or name"
              placeholderTextColor="#6B7280"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={runCheck}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.searchBtn, loading && { opacity: 0.6 }]}
              onPress={runCheck}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.searchBtnText}>
                {loading ? '...' : 'Check'}
              </Text>
            </TouchableOpacity>
          </View>

          <WaveLoader active={loading} />

          {loading && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#FF0000" />
              <Text style={styles.statusText}>{status}</Text>
            </View>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Results */}
        {channel && (
          <Animated.View
            style={{
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            }}
          >
            {/* Channel Profile */}
            <View style={styles.profileCard}>
              {snippet.thumbnails?.medium?.url && (
                <Image
                  source={{ uri: snippet.thumbnails.medium.url }}
                  style={styles.avatar}
                />
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.channelName}>{snippet.title}</Text>
                <Text style={styles.channelHandle} numberOfLines={1}>
                  {snippet.customUrl || snippet.channelId}
                </Text>
                <Text style={styles.channelDesc} numberOfLines={2}>
                  {snippet.description || 'No description'}
                </Text>
              </View>
            </View>

            {/* Health Score */}
            <ScoreRing score={score} />

            {/* Main Stats */}
            <Text style={styles.sectionTitle}>Channel Stats</Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Subscribers"
                value={formatNum(stats.subscriberCount)}
                color="#FF0000"
                delay={0}
              />
              <StatCard
                label="Total Views"
                value={formatNum(stats.viewCount)}
                color="#378ADD"
                delay={100}
              />
              <StatCard
                label="Videos"
                value={formatNum(stats.videoCount)}
                color="#1D9E75"
                delay={200}
              />
              <StatCard
                label="Avg Views"
                value={formatNum(avgViews)}
                color="#F59E0B"
                delay={300}
              />
            </View>

            {/* Traffic Bars */}
            <Text style={styles.sectionTitle}>Traffic Analysis</Text>
            <View style={styles.trafficCard}>
              <TrafficBar
                label="Subscribers"
                value={parseInt(stats.subscriberCount || 0)}
                max={10_000_000}
                color="#FF0000"
                delay={0}
              />
              <TrafficBar
                label="Total Views"
                value={parseInt(stats.viewCount || 0)}
                max={1_000_000_000}
                color="#378ADD"
                delay={100}
              />
              <TrafficBar
                label="Video Count"
                value={parseInt(stats.videoCount || 0)}
                max={5000}
                color="#1D9E75"
                delay={200}
              />
              <TrafficBar
                label="Avg Likes"
                value={avgLikes}
                max={100_000}
                color="#F59E0B"
                delay={300}
              />
            </View>

            {/* Engagement */}
            <Text style={styles.sectionTitle}>Engagement Metrics</Text>
            <View style={styles.engCard}>
              {[
                {
                  label: 'Sub / View Ratio',
                  value:
                    stats.viewCount > 0
                      ? (
                          (parseInt(stats.subscriberCount) /
                            parseInt(stats.viewCount)) *
                          100
                        ).toFixed(2) + '%'
                      : '—',
                },
                { label: 'Avg Likes / Video', value: formatNum(avgLikes) },
                { label: 'Avg Views / Video', value: formatNum(avgViews) },
                { label: 'Total Videos', value: formatNum(stats.videoCount) },
              ].map((item, i) => (
                <View key={i} style={styles.engRow}>
                  <Text style={styles.engRowLabel}>{item.label}</Text>
                  <Text style={styles.engRowVal}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Recent Videos */}
            {videos.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Videos</Text>
                {videos.map((v, i) => (
                  <VideoCard key={v.id} video={v} index={i} />
                ))}
              </>
            )}

            <View style={{ height: 40 }} />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
export default YouTubeChecker;
// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F0F' },
  scroll: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    backgroundColor: '#0F0F0F',
  },
  ytBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ytBadgeText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSub: { fontSize: 13, color: '#6B7280' },
  searchSection: { paddingHorizontal: 16, paddingBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: '#FF0000',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
  },
  statusText: { fontSize: 12, color: '#9CA3AF' },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  profileCard: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#2A2A2A',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  channelName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  channelHandle: { fontSize: 12, color: '#FF0000', marginBottom: 4 },
  channelDesc: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  scoreWrap: { alignItems: 'center', marginVertical: 8 },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1C',
  },
  scoreNum: { fontSize: 28, fontWeight: '700' },
  scoreLabel: { fontSize: 11, fontWeight: '500' },
  scoreTitle: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  trafficCard: {
    marginHorizontal: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2A2A2A',
  },
  barLabel: { fontSize: 12, color: '#9CA3AF' },
  barVal: { fontSize: 12, fontWeight: '600' },
  barTrack: {
    width: '100%',
    height: 7,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  engCard: {
    marginHorizontal: 16,
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#2A2A2A',
  },
  engRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2A2A2A',
  },
  engRowLabel: { fontSize: 13, color: '#9CA3AF' },
  engRowVal: { fontSize: 13, fontWeight: '600', color: '#fff' },
  videoCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#2A2A2A',
    flexDirection: 'row',
  },
  thumb: { width: 110, height: 80 },
  videoInfo: { flex: 1, padding: 10 },
  videoTitle: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 6,
    lineHeight: 17,
  },
  videoStats: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  vStat: { fontSize: 11, color: '#6B7280' },
  engBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF000022',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  engText: { fontSize: 10, color: '#FF0000', fontWeight: '600' },
});
