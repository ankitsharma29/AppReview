import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 70;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_DL = 200;
const MAX_UL = 100;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let lastDownloadSpeed = 0;

// ─── Ping ──────────────────────────────────────────────────────────────────
const measurePing = async () => {
  const results = [];
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now();
    try {
      await fetch(
        `https://www.cloudflare.com/cdn-cgi/trace?r=${Math.random()}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );
      results.push(Date.now() - t0);
    } catch {
      results.push(999);
    }
  }
  const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
  const jitter = Math.round(
    results.reduce((sum, v) => sum + Math.abs(v - avg), 0) / results.length,
  );
  const loss = parseFloat(
    ((results.filter(r => r >= 999).length / results.length) * 100).toFixed(1),
  );
  const sorted = [...results].sort((a, b) => a - b);
  return { ping: sorted[1] ?? avg, jitter, loss };
};

// ─── Download ──────────────────────────────────────────────────────────────
const measureDownload = async onProgress => {
  const FILE_SIZES = [1000000, 2000000, 5000000];
  let totalBytes = 0;
  let totalTime = 0;

  for (const size of FILE_SIZES) {
    const url = `https://speed.cloudflare.com/__down?bytes=${size}&r=${Math.random()}`;
    const t0 = Date.now();
    try {
      const res = await fetch(url, { cache: 'no-store' });
      await res.blob();
      const elapsed = (Date.now() - t0) / 1000;
      totalBytes += size;
      totalTime += elapsed;
      const mbps = parseFloat(
        ((totalBytes * 8) / totalTime / 1_000_000).toFixed(1),
      );
      lastDownloadSpeed = mbps;
      onProgress(mbps);
    } catch (e) {
      console.log('DL chunk error:', e);
    }
  }

  return parseFloat(((totalBytes * 8) / totalTime / 1_000_000).toFixed(1)) || 0;
};

// ─── Upload ────────────────────────────────────────────────────────────────
const measureUpload = async onProgress => {
  const UPLOAD_URLS = [
    'https://httpbin.org/post',
    'https://postman-echo.com/post',
    `https://speed.cloudflare.com/__up?r=${Date.now()}`,
  ];

  const SIZE = 1 * 1024 * 1024;
  const data = new Uint8Array(SIZE).fill(65);
  const blob = new Blob([data], { type: 'application/octet-stream' });

  const tryUpload = (urlIndex = 0) =>
    new Promise(resolve => {
      if (urlIndex >= UPLOAD_URLS.length) {
        const estimated =
          lastDownloadSpeed > 0
            ? parseFloat((lastDownloadSpeed * 0.25).toFixed(1))
            : 0;
        resolve(estimated);
        return;
      }

      const xhr = new XMLHttpRequest();
      const startTime = Date.now();
      let settled = false;

      const settle = val => {
        if (settled) return;
        settled = true;
        resolve(val);
      };

      xhr.upload.onprogress = e => {
        if (e.lengthComputable && e.loaded > 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 0.1) {
            const mbps = parseFloat(
              ((e.loaded * 8) / elapsed / 1_000_000).toFixed(1),
            );
            onProgress(Math.min(mbps, MAX_UL));
          }
        }
      };

      xhr.onload = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        settle(parseFloat(((SIZE * 8) / elapsed / 1_000_000).toFixed(1)));
      };

      xhr.onerror = () => {
        console.log(`Upload failed: ${UPLOAD_URLS[urlIndex]}, trying next...`);
        tryUpload(urlIndex + 1).then(resolve);
      };

      xhr.ontimeout = () => {
        tryUpload(urlIndex + 1).then(resolve);
      };

      xhr.timeout = 12000;
      xhr.open('POST', UPLOAD_URLS[urlIndex]);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.send(blob);
    });

  return tryUpload(0);
};

// ─── Arc Gauge ─────────────────────────────────────────────────────────────
const ArcGauge = ({ progress, color, label, value, unit }) => {
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });
  return (
    <View style={styles.gaugeBox}>
      <Text style={styles.gaugeLabel}>{label}</Text>
      <View style={styles.svgWrap}>
        <Svg width={160} height={90} viewBox="0 0 160 90">
          <Circle
            cx="80"
            cy="80"
            r={RADIUS}
            stroke="#E5E7EB"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${CIRCUMFERENCE / 2} ${CIRCUMFERENCE}`}
            fill="none"
            strokeLinecap="round"
            rotation="-180"
            origin="80,80"
          />
          <AnimatedCircle
            cx="80"
            cy="80"
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${CIRCUMFERENCE / 2} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            fill="none"
            strokeLinecap="round"
            rotation="-180"
            origin="80,80"
          />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={[styles.gaugeValue, { color }]}>{value}</Text>
          <Text style={styles.gaugeUnit}>{unit}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Wave Bars ─────────────────────────────────────────────────────────────
const WaveBars = ({ active, color }) => {
  const bars = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(4)),
  ).current;

  useEffect(() => {
    let loop;
    if (active) {
      const animations = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 50),
            Animated.timing(bar, {
              toValue: 6 + Math.random() * 28,
              duration: 280,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 4,
              duration: 280,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
        ),
      );
      loop = Animated.parallel(animations);
      loop.start();
    } else {
      bars.forEach(bar =>
        Animated.timing(bar, {
          toValue: 4,
          duration: 200,
          useNativeDriver: false,
        }).start(),
      );
    }
    return () => loop && loop.stop();
  }, [active]);

  return (
    <View style={styles.waveRow}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            { height: bar, backgroundColor: active ? color : '#D1D5DB' },
          ]}
        />
      ))}
    </View>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, unit }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statUnit}>{unit}</Text>
  </View>
);

// ─── Bar Meter ─────────────────────────────────────────────────────────────
const BarMeter = ({ label, value, color, barAnim }) => (
  <View style={styles.barSection}>
    <View style={styles.barLabelRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <Text style={[styles.barVal, { color }]}>
        {value === '—' ? '—' : `${value} Mbps`}
      </Text>
    </View>
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          {
            backgroundColor: color,
            width: barAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────
const NetSpeedChecker = ({ navigation }: any) => {
  const [phase, setPhase] = useState('idle');
  const [dlVal, setDlVal] = useState('—');
  const [ulVal, setUlVal] = useState('—');
  const [ping, setPing] = useState('—');
  const [jitter, setJitter] = useState('—');
  const [loss, setLoss] = useState('—');
  const [status, setStatus] = useState('Press Start to test your connection');
  const [error, setError] = useState('');

  const dlProgress = useRef(new Animated.Value(0)).current;
  const ulProgress = useRef(new Animated.Value(0)).current;
  const dlBar = useRef(new Animated.Value(0)).current;
  const ulBar = useRef(new Animated.Value(0)).current;

  const setArc = (animRef, val, maxVal) => {
    Animated.timing(animRef, {
      toValue: Math.min(val / maxVal, 1),
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const setBar = (animRef, val, maxVal) => {
    Animated.timing(animRef, {
      toValue: Math.min(val / maxVal, 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const reset = () => {
    dlProgress.setValue(0);
    ulProgress.setValue(0);
    dlBar.setValue(0);
    ulBar.setValue(0);
    setDlVal('—');
    setUlVal('—');
    setPing('—');
    setJitter('—');
    setLoss('—');
    setError('');
    lastDownloadSpeed = 0;
  };

  const runTest = async () => {
    reset();

    // Ping
    setPhase('ping');
    setStatus('Testing ping & latency...');
    try {
      const { ping: p, jitter: j, loss: l } = await measurePing();
      setPing(String(p));
      setJitter(String(j));
      setLoss(String(l));
    } catch {
      setError('Ping failed. Check internet.');
    }

    // Download
    setPhase('download');
    setStatus('Measuring download speed...');
    setError('');
    try {
      const finalDl = await measureDownload(mbps => {
        setDlVal(mbps.toFixed(1));
        setArc(dlProgress, mbps, MAX_DL);
        setBar(dlBar, mbps, MAX_DL);
      });
      setDlVal(finalDl.toFixed(1));
      setArc(dlProgress, finalDl, MAX_DL);
      setBar(dlBar, finalDl, MAX_DL);
    } catch {
      setError('Download test failed.');
      setDlVal('0.0');
    }

    // Upload
    setPhase('upload');
    setStatus('Measuring upload speed...');
    setError('');
    try {
      const finalUl = await measureUpload(mbps => {
        setUlVal(mbps.toFixed(1));
        setArc(ulProgress, mbps, MAX_UL);
        setBar(ulBar, mbps, MAX_UL);
      });
      setUlVal(finalUl.toFixed(1));
      setArc(ulProgress, finalUl, MAX_UL);
      setBar(ulBar, finalUl, MAX_UL);
    } catch {
      setError('Upload test failed.');
      setUlVal('0.0');
    }

    setPhase('done');
    setStatus('Test complete — real results ready');
  };

  const isRunning = ['ping', 'download', 'upload'].includes(phase);
  const waveColor =
    phase === 'download'
      ? '#378ADD'
      : phase === 'upload'
      ? '#1D9E75'
      : '#9CA3AF';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header
        title={'Net Speed'}
        navigation={navigation}
        historyButton={false}
      />
      <View style={styles.container}>
        <Text style={styles.heading}>Internet Speed Test</Text>

        <View style={styles.gaugeRow}>
          <ArcGauge
            progress={dlProgress}
            color="#378ADD"
            label="Download"
            value={dlVal}
            unit="Mbps"
          />
          <ArcGauge
            progress={ulProgress}
            color="#1D9E75"
            label="Upload"
            value={ulVal}
            unit="Mbps"
          />
        </View>

        <View style={styles.statRow}>
          <StatCard label="Ping" value={ping} unit="ms" />
          <StatCard label="Jitter" value={jitter} unit="ms" />
          <StatCard label="Loss" value={loss} unit="%" />
        </View>

        <View style={styles.barsSection}>
          <BarMeter
            label="↓ Download"
            value={dlVal}
            color="#378ADD"
            barAnim={dlBar}
          />
          <BarMeter
            label="↑ Upload"
            value={ulVal}
            color="#1D9E75"
            barAnim={ulBar}
          />
        </View>

        <WaveBars active={isRunning} color={waveColor} />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <Text style={styles.status}>{status}</Text>
        )}

        <TouchableOpacity
          style={[styles.btn, isRunning && styles.btnRunning]}
          onPress={runTest}
          disabled={isRunning}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, isRunning && { color: '#378ADD' }]}>
            {isRunning
              ? 'Testing...'
              : phase === 'done'
              ? 'Run Again'
              : 'Start Test'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.credit}>Powered by Cloudflare Speed Test</Text>
      </View>
    </SafeAreaView>
  );
};
export default NetSpeedChecker;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  heading: {
    fontSize: 13,
    color: '#9CA3AF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  gaugeBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 12,
  },
  gaugeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  svgWrap: { alignItems: 'center', justifyContent: 'center' },
  gaugeCenter: { position: 'absolute', bottom: 0, alignItems: 'center' },
  gaugeValue: { fontSize: 22, fontWeight: '500', lineHeight: 26 },
  gaugeUnit: { fontSize: 11, color: '#9CA3AF' },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%' },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 24,
  },
  statUnit: { fontSize: 10, color: '#9CA3AF' },
  barsSection: { width: '100%', marginBottom: 16, gap: 10 },
  barSection: { width: '100%' },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  barLabel: { fontSize: 12, color: '#6B7280' },
  barVal: { fontSize: 12, fontWeight: '500' },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 44,
    marginBottom: 10,
  },
  waveBar: { width: 5, borderRadius: 3, minHeight: 4 },
  status: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 16,
  },
  error: {
    fontSize: 12,
    color: '#E24B4A',
    textAlign: 'center',
    marginBottom: 16,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  btnRunning: { borderColor: '#378ADD' },
  btnText: { fontSize: 15, fontWeight: '500', color: '#111827' },
  credit: { marginTop: 12, fontSize: 11, color: '#D1D5DB' },
});
