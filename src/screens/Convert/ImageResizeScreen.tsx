// src/screens/ImageResizeScreen.tsx
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
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Share from 'react-native-share';
import { requestPhotoPermission } from '../../utils/permissions';
import {
  resizeImageToTarget,
  saveResizedFile,
  formatBytes,
  stripScheme,
  addScheme,
  toBytes,
  SizeUnit,
  ImageFileItem,
  ResizeResult,
} from '../../utils/resizer';
import { COLORS, RADIUS, SPACING } from '../../utils/theme';
import {
  AppButton,
  ProgressBar,
  SectionLabel,
  StatusBadge,
} from '../../components/UIComponents';

// ─────────────────────────────────────────────
// Preset target sizes
// ─────────────────────────────────────────────
const PRESETS: Array<{ label: string; value: number; unit: SizeUnit }> = [
  { label: '50 KB', value: 50, unit: 'KB' },
  { label: '100 KB', value: 100, unit: 'KB' },
  { label: '200 KB', value: 200, unit: 'KB' },
  { label: '500 KB', value: 500, unit: 'KB' },
  { label: '1 MB', value: 1, unit: 'MB' },
  { label: '2 MB', value: 2, unit: 'MB' },
];

interface ResultEntry {
  id: string;
  name: string;
  uri: string;
  originalSize: number;
  outputSize: number;
  savedPercent: number;
  finalQuality: number;
}

export default function ImageResizeScreen() {
  const [files, setFiles] = useState<ImageFileItem[]>([]);
  const [targetValue, setTargetValue] = useState('200');
  const [targetUnit, setTargetUnit] = useState<SizeUnit>('KB');
  const [customMode, setCustomMode] = useState(false);
  const [selectedPreset, setPreset] = useState(2); // 200 KB default
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<ResultEntry[]>([]);

  useEffect(() => {
    requestPhotoPermission();
  }, []);

  // ── Pick images ──────────────────────────────────────────────
  const pickImages = useCallback(async () => {
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
        const mapped: ImageFileItem[] = assets.map(a => ({
          id: Math.random().toString(36).slice(2) + Date.now(),
          uri: a.uri ?? '',
          name: a.fileName ?? `image_${Date.now()}.jpg`,
          size: a.fileSize ?? 0,
          type: a.type ?? 'image/jpeg',
          status: 'ready',
        }));
        setFiles(prev => [...prev, ...mapped]);
        setResults([]);
      },
    );
  }, []);

  const removeFile = (id: string) =>
    setFiles(prev => prev.filter(f => f.id !== id));

  const clearAll = () => {
    setFiles([]);
    setResults([]);
  };

  // ── Apply preset ─────────────────────────────────────────────
  const applyPreset = (idx: number) => {
    const p = PRESETS[idx];
    setPreset(idx);
    setTargetValue(String(p.value));
    setTargetUnit(p.unit);
    setCustomMode(false);
  };

  // ── Resize all ───────────────────────────────────────────────
  const handleResize = async () => {
    if (!files.length) return;

    const tv = parseFloat(targetValue);
    if (isNaN(tv) || tv <= 0) {
      Alert.alert(
        'Invalid Target',
        'Please enter a valid target size greater than 0',
      );
      return;
    }

    const targetBytes = toBytes(tv, targetUnit);
    setProcessing(true);
    setProgress(0);
    setCurrentIdx(0);
    setResults([]);

    const newResults: ResultEntry[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setCurrentIdx(i + 1);
      setFiles(prev =>
        prev.map(x => (x.id === f.id ? { ...x, status: 'processing' } : x)),
      );

      const result: ResizeResult = await resizeImageToTarget(
        f.uri,
        f.name,
        targetBytes,
        pct =>
          setProgress(
            Math.round((i / files.length) * 100 + pct / files.length),
          ),
      );

      if (result.success) {
        newResults.push({
          id: f.id,
          name: result.outputName,
          uri: result.outputUri,
          originalSize: result.originalSize,
          outputSize: result.outputSize,
          savedPercent: result.savedPercent,
          finalQuality: result.finalQuality,
        });
        setFiles(prev =>
          prev.map(x =>
            x.id === f.id
              ? {
                  ...x,
                  status: 'done',
                  outputUri: result.outputUri,
                  outputSize: result.outputSize,
                  savedPercent: result.savedPercent,
                }
              : x,
          ),
        );
      } else {
        Alert.alert('Failed', `${f.name}: ${result.error}`);
        setFiles(prev =>
          prev.map(x => (x.id === f.id ? { ...x, status: 'error' } : x)),
        );
      }
    }

    setResults(newResults);
    setProgress(100);
    setProcessing(false);
  };

  // ── Save / Share ─────────────────────────────────────────────
  const handleSave = async (r: ResultEntry) => {
    try {
      const dest = await saveResizedFile(r.uri, r.name);
      const short = dest.split('/').slice(-3).join('/');
      Alert.alert('✅ Saved', `…/${short}`);
    } catch (e: any) {
      Alert.alert('Save Failed', e?.message);
    }
  };

  const handleShare = async (r: ResultEntry) => {
    try {
      await Share.open({
        url: r.uri,
        title: r.name,
        type: 'image/jpeg',
        failOnCancel: false,
      });
    } catch {}
  };

  const handleSaveAll = async () => {
    let saved = 0;
    for (const r of results) {
      try {
        await saveResizedFile(r.uri, r.name);
        saved++;
      } catch {}
    }
    Alert.alert('✅ Done', `${saved}/${results.length} files saved`);
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
        <Text style={S.headerIcon}>🗜️</Text>
        <Text style={S.title}>Image Resizer</Text>
        <Text style={S.subtitle}>Compress images to exact KB / MB</Text>
      </View>

      {/* Pick button */}
      <TouchableOpacity
        style={S.dropZone}
        onPress={pickImages}
        activeOpacity={0.8}
      >
        <Text style={S.dropIcon}>📂</Text>
        <Text style={S.dropTitle}>Tap to choose images</Text>
        <Text style={S.dropSub}>JPG · PNG · JPEG · WEBP</Text>
        {files.length > 0 && (
          <View style={S.addBadge}>
            <Text style={S.addTxt}>+ Add more</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Target size section */}
      <View style={S.panel}>
        <SectionLabel text="Target File Size" />

        {/* Presets */}
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
            placeholder="e.g. 350"
            placeholderTextColor={COLORS.muted}
            onFocus={() => setCustomMode(true)}
          />
          {/* Unit toggle */}
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

      {/* File list */}
      {files.length > 0 && (
        <>
          <View style={S.listHeader}>
            <Text style={S.listTitle}>
              {files.length} image{files.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={S.clearTxt}>Clear all</Text>
            </TouchableOpacity>
          </View>

          {files.map(f => (
            <FileRow key={f.id} file={f} onRemove={() => removeFile(f.id)} />
          ))}
        </>
      )}

      {/* Progress */}
      {processing && (
        <View style={S.progressBox}>
          <Text style={S.progressLabel}>
            Processing {currentIdx}/{files.length} — {progress}%
          </Text>
          <ProgressBar value={progress} />
        </View>
      )}

      {/* Resize button */}
      <AppButton
        label={
          processing
            ? `Resizing… ${progress}%`
            : `🗜️ Resize ${files.length} image${files.length !== 1 ? 's' : ''}`
        }
        onPress={handleResize}
        disabled={!files.length || processing}
        loading={processing}
        style={S.actionBtn}
      />

      {/* Results */}
      {results.length > 0 && (
        <View style={S.resultsBox}>
          <Text style={S.resultsTitle}>
            ✅ {results.length} file{results.length !== 1 ? 's' : ''} resized
          </Text>
          {results.map(r => (
            <ResizeResultRow
              key={r.id}
              result={r}
              onSave={() => handleSave(r)}
              onShare={() => handleShare(r)}
            />
          ))}
          {results.length > 1 && (
            <AppButton
              label={`↓ Save All (${results.length})`}
              onPress={handleSaveAll}
              variant="success"
              style={{ marginTop: 12 }}
            />
          )}
        </View>
      )}

      {files.length === 0 && results.length === 0 && (
        <Text style={S.empty}>No images selected — tap above to begin</Text>
      )}
    </ScrollView>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function FileRow({
  file,
  onRemove,
}: {
  file: ImageFileItem;
  onRemove: () => void;
}) {
  return (
    <View style={S.fileRow}>
      <Image source={{ uri: file.uri }} style={S.thumb} resizeMode="cover" />
      <View style={S.fileInfo}>
        <Text style={S.fileName} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={S.fileMeta}>
          {formatBytes(file.size)}
          {file.outputSize ? ` → ${formatBytes(file.outputSize)}` : ''}
          {file.savedPercent ? ` (−${file.savedPercent}%)` : ''}
        </Text>
        <StatusBadge
          status={file.status === 'processing' ? 'converting' : file.status}
        />
      </View>
      {file.status === 'ready' && (
        <TouchableOpacity
          onPress={onRemove}
          style={S.removeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={S.removeTxt}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ResizeResultRow({
  result,
  onSave,
  onShare,
}: {
  result: ResultEntry;
  onSave: () => void;
  onShare: () => void;
}) {
  const saved = result.originalSize - result.outputSize;
  return (
    <View style={S.resultRow}>
      <View style={S.resultInfo}>
        <Text style={S.resultName} numberOfLines={1}>
          {result.name}
        </Text>
        <View style={S.resultMeta}>
          <Text style={S.resultOrig}>{formatBytes(result.originalSize)}</Text>
          <Text style={S.resultArrow}> → </Text>
          <Text style={S.resultNew}>{formatBytes(result.outputSize)}</Text>
        </View>
        <View style={S.savingBadge}>
          <Text style={S.savingTxt}>
            −{result.savedPercent}% · saved {formatBytes(saved)} · Q
            {result.finalQuality}
          </Text>
        </View>
      </View>
      <View style={S.resultBtns}>
        <TouchableOpacity
          style={S.saveBtn}
          onPress={onSave}
          activeOpacity={0.7}
        >
          <Text style={S.saveBtnTxt}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={S.shareBtn}
          onPress={onShare}
          activeOpacity={0.7}
        >
          <Text style={S.shareBtnTxt}>⬆</Text>
        </TouchableOpacity>
      </View>
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
  subtitle: { fontSize: 13, color: COLORS.muted, fontFamily: 'Courier New' },

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
    alignItems: 'center',
    marginBottom: 10,
  },
  listTitle: { color: COLORS.muted, fontSize: 12, fontFamily: 'Courier New' },
  clearTxt: { color: COLORS.accent2, fontSize: 12, fontWeight: '600' },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
  },
  thumb: { width: 56, height: 56, borderRadius: RADIUS.sm },
  fileInfo: { flex: 1, gap: 4 },
  fileName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  fileMeta: { color: COLORS.muted, fontSize: 11, fontFamily: 'Courier New' },
  removeBtn: { padding: 4 },
  removeTxt: { color: COLORS.muted, fontSize: 16, fontWeight: '700' },

  progressBox: { marginBottom: SPACING.md },
  progressLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
    marginBottom: 6,
    textAlign: 'center',
  },

  actionBtn: { marginBottom: SPACING.md },

  resultsBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  resultsTitle: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  resultInfo: { flex: 1 },
  resultName: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: 'Courier New',
    marginBottom: 4,
  },
  resultMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  resultOrig: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
    textDecorationLine: 'line-through',
  },
  resultArrow: { color: COLORS.muted, fontSize: 12 },
  resultNew: {
    color: COLORS.success,
    fontSize: 12,
    fontFamily: 'Courier New',
    fontWeight: '700',
  },
  savingBadge: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  savingTxt: { color: COLORS.success, fontSize: 10, fontFamily: 'Courier New' },

  resultBtns: { flexDirection: 'row', gap: 6 },
  saveBtn: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  saveBtnTxt: { color: COLORS.success, fontSize: 14, fontWeight: '700' },
  shareBtn: {
    backgroundColor: 'rgba(124,106,247,0.15)',
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  shareBtnTxt: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },

  empty: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
    marginTop: SPACING.lg,
  },
});
