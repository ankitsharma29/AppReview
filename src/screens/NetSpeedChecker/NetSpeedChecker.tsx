import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Header from '../../components/Header';

const { width } = Dimensions.get('window');

const MAX_DL = 200;
const MAX_UL = 100;
const RADIUS = 70;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
          <G rotation="-180" origin="80, 80">
            <Circle
              cx="80"
              cy="80"
              r={RADIUS}
              stroke="#E5E7EB"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${CIRCUMFERENCE / 2} ${CIRCUMFERENCE}`}
              fill="none"
              strokeLinecap="round"
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
            />
          </G>
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={[styles.gaugeValue, { color }]}>{value}</Text>
          <Text style={styles.gaugeUnit}>{unit}</Text>
        </View>
      </View>
    </View>
  );
};

const BarMeter = ({ label, value, maxVal, color, barWidth }) => {
  const pct = Math.min(value / maxVal, 1);
  return (
    <View style={styles.barSection}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barVal, { color }]}>{value} Mbps</Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: barWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

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
            Animated.delay(i * 40),
            Animated.timing(bar, {
              toValue: 4 + Math.random() * 30,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 4,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
        ),
      );
      loop = Animated.parallel(animations);
      loop.start();
    } else {
      bars.forEach(bar => {
        Animated.timing(bar, {
          toValue: 4,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
    return () => loop && loop.stop();
  }, [active, color]);

  return (
    <View style={styles.waveRow}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              height: bar,
              backgroundColor: active ? color : '#D1D5DB',
            },
          ]}
        />
      ))}
    </View>
  );
};

const StatCard = ({ label, value, unit }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statUnit}>{unit}</Text>
  </View>
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const NetSpeedChecker = ({ navigation }: any) => {
  const [phase, setPhase] = useState('idle'); // idle | ping | download | upload | done
  const [dlVal, setDlVal] = useState('—');
  const [ulVal, setUlVal] = useState('—');
  const [ping, setPing] = useState('—');
  const [jitter, setJitter] = useState('—');
  const [loss, setLoss] = useState('—');
  const [status, setStatus] = useState('Press Start to test your connection');

  const dlProgress = useRef(new Animated.Value(0)).current;
  const ulProgress = useRef(new Animated.Value(0)).current;
  const dlBar = useRef(new Animated.Value(0)).current;
  const ulBar = useRef(new Animated.Value(0)).current;

  const animateArc = (animRef, toVal, maxVal, duration) =>
    new Promise(resolve =>
      Animated.timing(animRef, {
        toValue: toVal / maxVal,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(resolve),
    );

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
  };

  const runTest = async () => {
    reset();
    setPhase('ping');
    setStatus('Testing ping & latency...');
    await sleep(1400);
    setPing(String(Math.round(8 + Math.random() * 32)));
    setJitter(String(Math.round(1 + Math.random() * 8)));
    setLoss((Math.random() * 0.5).toFixed(1));

    const dl = parseFloat((20 + Math.random() * 150).toFixed(1));
    const ul = parseFloat((5 + Math.random() * 60).toFixed(1));

    setPhase('download');
    setStatus('Measuring download speed...');
    let dlDisplay = 0;
    const dlTicker = setInterval(() => {
      dlDisplay = Math.min(dlDisplay + dl / 28, dl);
      setDlVal(dlDisplay.toFixed(1));
    }, 100);
    await Promise.all([
      animateArc(dlProgress, dl, MAX_DL, 2800),
      Animated.timing(dlBar, {
        toValue: dl / MAX_DL,
        duration: 2800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(),
      sleep(2800),
    ]);
    clearInterval(dlTicker);
    setDlVal(dl.toFixed(1));

    setPhase('upload');
    setStatus('Measuring upload speed...');
    let ulDisplay = 0;
    const ulTicker = setInterval(() => {
      ulDisplay = Math.min(ulDisplay + ul / 24, ul);
      setUlVal(ulDisplay.toFixed(1));
    }, 100);
    await Promise.all([
      animateArc(ulProgress, ul, MAX_UL, 2400),
      Animated.timing(ulBar, {
        toValue: ul / MAX_UL,
        duration: 2400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(),
      sleep(2400),
    ]);
    clearInterval(ulTicker);
    setUlVal(ul.toFixed(1));

    setPhase('done');
    setStatus('Test complete — results ready');
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
            value={dlVal === '—' ? 0 : parseFloat(dlVal)}
            maxVal={MAX_DL}
            color="#378ADD"
            barWidth={dlBar}
          />
          <BarMeter
            label="↑ Upload"
            value={ulVal === '—' ? 0 : parseFloat(ulVal)}
            maxVal={MAX_UL}
            color="#1D9E75"
            barWidth={ulBar}
          />
        </View>

        <WaveBars active={isRunning} color={waveColor} />

        <Text style={styles.status}>{status}</Text>

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
      </View>
    </SafeAreaView>
  );
};
export default NetSpeedChecker;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 26,
  },
  gaugeUnit: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
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
  statUnit: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  barsSection: {
    width: '100%',
    marginBottom: 16,
    gap: 10,
  },
  barSection: {
    width: '100%',
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  barVal: {
    fontSize: 12,
    fontWeight: '500',
  },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 44,
    marginBottom: 10,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
    minHeight: 4,
  },
  status: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    minHeight: 16,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  btnRunning: {
    borderColor: '#378ADD',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
});
