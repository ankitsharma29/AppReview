// src/screens/PdfResizeScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Share from 'react-native-share';
import { requestPhotoPermission } from '../../utils/permissions';
import {
  resizePdfToTarget,
  saveResizedFile,
  formatBytes,
  toBytes,
  SizeUnit,
  PdfResizeResult,
  PdfSourceImage,
} from '../../utils/resizer';
import { COLORS, RADIUS, SPACING } from '../../utils/theme';
import {
  AppButton,
  ProgressBar,
  SectionLabel,
} from '../../components/UIComponents';

// ─────────────────────────────────────────────
// Preset sizes
// ─────────────────────────────────────────────
const PRESETS: Array<{ label: string; value: number; unit: SizeUnit }> = [
  { label: '100 KB', value: 100, unit: 'KB' },
  { label: '300 KB', value: 300, unit: 'KB' },
  { label: '500 KB', value: 500, unit: 'KB' },
  { label: '1 MB', value: 1, unit: 'MB' },
  { label: '2 MB', value: 2, unit: 'MB' },
  { label: '5 MB', value: 5, unit: 'MB' },
];

interface SourcePage {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
}

export default function PdfResizeScreen() {
  const [pages, setPages] = useState<SourcePage[]>([]);
  const [targetValue, setTargetValue] = useState('1');
  const [targetUnit, setTargetUnit] = useState<SizeUnit>('MB');
  const [customMode, setCustomMode] = useState(false);
  const [selectedPreset, setPreset] = useState(3); // 1 MB default
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PdfResizeResult | null>(null);

  useEffect(() => {
    requestPhotoPermission();
  }, []);

  // ── Pick source images (pages) ───────────────────────────────
  const pickPages = useCallback(async () => {
    const ok = await requestPhotoPermission();
    if (!ok) return;

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 0,
        includeBase64: false,
        quality: 1,
      },
      res => {
        if (res.didCancel) return;
        if (res.errorCode) {
          Alert.alert('Error', res.errorMessage ?? 'Could not open picker');
          return;
        }
        const assets = res.assets ?? [];
        const mapped: SourcePage[] = assets.map(a => ({
          id: Math.random().toString(36).slice(2) + Date.now(),
          uri: a.uri ?? '',
          name: a.fileName ?? `page_${Date.now()}.jpg`,
          size: a.fileSize ?? 0,
          type: a.type ?? 'image/jpeg',
        }));
        setPages(prev => [...prev, ...mapped]);
        setResult(null);
      },
    );
  }, []);

  const removePage = (id: string) =>
    setPages(prev => prev.filter(p => p.id !== id));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setPages(prev => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  };

  const moveDown = (idx: number) => {
    setPages(prev => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };

  const clearAll = () => {
    setPages([]);
    setResult(null);
  };

  // ── Apply preset ─────────────────────────────────────────────
  const applyPreset = (idx: number) => {
    const p = PRESETS[idx];
    setPreset(idx);
    setTargetValue(String(p.value));
    setTargetUnit(p.unit);
    setCustomMode(false);
  };

  // ── Total source size ─────────────────────────────────────────
  const totalSourceSize = pages.reduce((s, p) => s + p.size, 0);

  // ── Resize PDF ───────────────────────────────────────────────
  const handleResize = async () => {
    if (!pages.length) return;

    const tv = parseFloat(targetValue);
    if (isNaN(tv) || tv <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target size');
      return;
    }

    const targetBytes = toBytes(tv, targetUnit);
    setProcessing(true);
    setProgress(0);
    setResult(null);

    const sources: PdfSourceImage[] = pages.map(p => ({
      uri: p.uri,
      name: p.name,
      size: p.size,
    }));

    const res = await resizePdfToTarget(sources, targetBytes, pct =>
      setProgress(pct),
    );

    setResult(res);
    setProcessing(false);

    if (!res.success) {
      Alert.alert('PDF Resize Failed', res.error ?? 'Unknown error');
    }
  };

  // ── Save / Share ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!result?.success) return;
    try {
      const dest = await saveResizedFile(result.outputUri, result.outputName);
      const short = dest.split('/').slice(-3).join('/');
      Alert.alert('✅ Saved', `…/${short}`);
    } catch (e: any) {
      Alert.alert('Save Failed', e?.message);
    }
  };

  const handleShare = async () => {
    if (!result?.success) return;
    try {
      await Share.open({
        url: result.outputUri,
        title: result.outputName,
        type: 'application/pdf',
        failOnCancel: false,
      });
    } catch {}
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={S.scroll}
      contentContainerStyle={S.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerIcon}>📄</Text>
        <Text style={S.title}>PDF Resizer</Text>
        <Text style={S.subtitle}>
          Combine images into a PDF at exact KB / MB
        </Text>
      </View>

      {/* How it works banner */}
      <View style={S.infoBanner}>
        <Text style={S.infoIcon}>ℹ️</Text>
        <Text style={S.infoText}>
          Add images as PDF pages. The resizer compresses them until the final
          PDF fits within your target size.
        </Text>
      </View>

      {/* Pick pages */}
      <TouchableOpacity
        style={S.dropZone}
        onPress={pickPages}
        activeOpacity={0.8}
      >
        <Text style={S.dropIcon}>🖼️</Text>
        <Text style={S.dropTitle}>Tap to add images as PDF pages</Text>
        <Text style={S.dropSub}>Order shown below = page order in PDF</Text>
        {pages.length > 0 && (
          <View style={S.addBadge}>
            <Text style={S.addTxt}>+ Add more pages</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Target size */}
      <View style={S.panel}>
        <SectionLabel text="Target PDF Size" />

        <View style={S.presets}>
          {PRESETS.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[
                S.presetBtn,
                !customMode && selectedPreset === i && S.presetActive,
              ]}
              onPress={() => applyPreset(i)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  S.presetTxt,
                  !customMode && selectedPreset === i && S.presetTxtActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom input */}
        <TouchableOpacity
          style={[S.customRow, customMode && S.customRowActive]}
          onPress={() => setCustomMode(true)}
          activeOpacity={0.9}
        >
          <Text style={S.customLabel}>Custom:</Text>
          <TextInput
            style={S.customInput}
            value={targetValue}
            onChangeText={v => {
              setTargetValue(v);
              setCustomMode(true);
            }}
            keyboardType="decimal-pad"
            placeholder="e.g. 1.5"
            placeholderTextColor={COLORS.muted}
            onFocus={() => setCustomMode(true)}
          />
          <View style={S.unitRow}>
            {(['KB', 'MB'] as SizeUnit[]).map(u => (
              <TouchableOpacity
                key={u}
                style={[S.unitBtn, targetUnit === u && S.unitActive]}
                onPress={() => {
                  setTargetUnit(u);
                  setCustomMode(true);
                }}
              >
                <Text style={[S.unitTxt, targetUnit === u && S.unitTxtActive]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>

        <View style={S.targetDisplay}>
          <Text style={S.targetLabel}>Target: </Text>
          <Text style={S.targetValue}>
            {targetValue || '0'} {targetUnit} ={' '}
            {formatBytes(toBytes(parseFloat(targetValue) || 0, targetUnit))}
          </Text>
        </View>
      </View>

      {/* Page list */}
      {pages.length > 0 && (
        <>
          <View style={S.listHeader}>
            <View>
              <Text style={S.listTitle}>
                {pages.length} page{pages.length !== 1 ? 's' : ''}
              </Text>
              <Text style={S.listSub}>
                Source size: {formatBytes(totalSourceSize)}
              </Text>
            </View>
            <TouchableOpacity onPress={clearAll}>
              <Text style={S.clearTxt}>Clear all</Text>
            </TouchableOpacity>
          </View>

          {pages.map((p, idx) => (
            <PageRow
              key={p.id}
              page={p}
              index={idx}
              total={pages.length}
              onRemove={() => removePage(p.id)}
              onMoveUp={() => moveUp(idx)}
              onMoveDown={() => moveDown(idx)}
            />
          ))}
        </>
      )}

      {/* Progress */}
      {processing && (
        <View style={S.progressBox}>
          <Text style={S.progressLabel}>Building PDF… {progress}%</Text>
          <ProgressBar value={progress} />
        </View>
      )}

      {/* Resize button */}
      <AppButton
        label={
          processing
            ? `Building PDF… ${progress}%`
            : `📄 Build PDF  (${pages.length} page${
                pages.length !== 1 ? 's' : ''
              })`
        }
        onPress={handleResize}
        disabled={!pages.length || processing}
        loading={processing}
        style={S.actionBtn}
      />

      {/* Result card */}
      {result?.success && (
        <View style={S.resultCard}>
          <Text style={S.resultTitle}>✅ PDF Ready</Text>

          <View style={S.resultGrid}>
            <ResultStat label="Pages" value={String(result.pageCount)} />
            <ResultStat
              label="Output Size"
              value={formatBytes(result.outputSize)}
              accent
            />
            <ResultStat label="Saved" value={`${result.savedPercent}%`} />
            <ResultStat
              label="JPEG Quality"
              value={`${result.finalQuality}%`}
            />
          </View>

          {/* Size comparison bar */}
          <View style={S.barSection}>
            <Text style={S.barLabel}>Compression</Text>
            <View style={S.barBg}>
              <View
                style={[
                  S.barFill,
                  { width: `${Math.min(100, 100 - result.savedPercent)}%` },
                ]}
              />
            </View>
            <View style={S.barLegend}>
              <Text style={S.barLegendTxt}>
                Output: {formatBytes(result.outputSize)}
              </Text>
              <Text style={S.barLegendTxt}>
                Target: {targetValue}
                {targetUnit}
              </Text>
            </View>
          </View>

          <View style={S.resultBtns}>
            <TouchableOpacity
              style={S.saveBtnLg}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={S.saveBtnTxt}>↓ Save PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={S.shareBtnLg}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={S.shareBtnTxt}>⬆ Share PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {result && !result.success && (
        <View style={S.errorCard}>
          <Text style={S.errorTitle}>❌ Failed</Text>
          <Text style={S.errorMsg}>{result.error}</Text>
        </View>
      )}

      {pages.length === 0 && !result && (
        <Text style={S.empty}>No pages added — tap above to begin</Text>
      )}
    </ScrollView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function PageRow({
  page,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  page: SourcePage;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <View style={S.pageRow}>
      <View style={S.pageNum}>
        <Text style={S.pageNumTxt}>{index + 1}</Text>
      </View>
      <Image
        source={{ uri: page.uri }}
        style={S.pageThumb}
        resizeMode="cover"
      />
      <View style={S.pageInfo}>
        <Text style={S.pageName} numberOfLines={1}>
          {page.name}
        </Text>
        <Text style={S.pageMeta}>{formatBytes(page.size)}</Text>
      </View>
      <View style={S.pageActions}>
        <TouchableOpacity
          style={[S.orderBtn, index === 0 && S.orderBtnDisabled]}
          onPress={onMoveUp}
          disabled={index === 0}
        >
          <Text style={S.orderBtnTxt}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.orderBtn, index === total - 1 && S.orderBtnDisabled]}
          onPress={onMoveDown}
          disabled={index === total - 1}
        >
          <Text style={S.orderBtnTxt}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={S.removeBtn} onPress={onRemove}>
          <Text style={S.removeTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ResultStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={S.statBox}>
      <Text style={[S.statVal, accent && { color: COLORS.accent3 }]}>
        {value}
      </Text>
      <Text style={S.statLbl}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const S = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: SPACING.md, paddingBottom: 60 },

  header: { alignItems: 'center', marginTop: 8, marginBottom: SPACING.lg },
  headerIcon: { fontSize: 42, marginBottom: 8 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Courier New',
    textAlign: 'center',
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(124,106,247,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.2)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.md,
  },
  infoIcon: { fontSize: 16 },
  infoText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
    lineHeight: 18,
  },

  dropZone: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
  },
  dropIcon: { fontSize: 36, marginBottom: 8 },
  dropTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  dropSub: { color: COLORS.muted, fontSize: 12, fontFamily: 'Courier New' },
  addBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(124,106,247,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  addTxt: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },

  panel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },

  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  presetActive: {
    backgroundColor: 'rgba(124,106,247,0.18)',
    borderColor: COLORS.accent,
  },
  presetTxt: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  presetTxtActive: { color: COLORS.accent },

  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 10,
  },
  customRowActive: { borderColor: COLORS.accent },
  customLabel: { color: COLORS.muted, fontSize: 13, fontFamily: 'Courier New' },
  customInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Courier New',
    padding: 0,
  },
  unitRow: { flexDirection: 'row', gap: 4 },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  unitActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  unitTxt: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  unitTxtActive: { color: COLORS.white },

  targetDisplay: { flexDirection: 'row', alignItems: 'center' },
  targetLabel: { color: COLORS.muted, fontSize: 12, fontFamily: 'Courier New' },
  targetValue: {
    color: COLORS.accent3,
    fontSize: 12,
    fontFamily: 'Courier New',
    fontWeight: '600',
  },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  listTitle: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  listSub: {
    color: COLORS.muted,
    fontSize: 11,
    fontFamily: 'Courier New',
    marginTop: 2,
  },
  clearTxt: { color: COLORS.accent2, fontSize: 12, fontWeight: '600' },

  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  pageNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumTxt: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  pageThumb: { width: 48, height: 48, borderRadius: RADIUS.sm },
  pageInfo: { flex: 1 },
  pageName: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  pageMeta: {
    color: COLORS.muted,
    fontSize: 11,
    fontFamily: 'Courier New',
    marginTop: 2,
  },
  pageActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  orderBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBtnDisabled: { opacity: 0.3 },
  orderBtnTxt: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTxt: { color: COLORS.error, fontSize: 12, fontWeight: '700' },

  progressBox: { marginBottom: SPACING.md },
  progressLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
    marginBottom: 6,
    textAlign: 'center',
  },

  actionBtn: { marginBottom: SPACING.md },

  resultCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  resultTitle: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 10,
    color: COLORS.muted,
    fontFamily: 'Courier New',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  barSection: { marginBottom: 16 },
  barLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontFamily: 'Courier New',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  barBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: '100%', backgroundColor: COLORS.accent3, borderRadius: 4 },
  barLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  barLegendTxt: {
    fontSize: 10,
    color: COLORS.muted,
    fontFamily: 'Courier New',
  },

  resultBtns: { flexDirection: 'row', gap: 10 },
  saveBtnLg: {
    flex: 1,
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnTxt: { color: COLORS.success, fontSize: 14, fontWeight: '700' },
  shareBtnLg: {
    flex: 1,
    backgroundColor: 'rgba(124,106,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.3)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareBtnTxt: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },

  errorCard: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorMsg: { color: COLORS.muted, fontSize: 12, fontFamily: 'Courier New' },

  empty: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
    marginTop: SPACING.lg,
  },
});
