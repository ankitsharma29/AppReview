// src/screens/HomeScreen.tsx
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-crop-picker';
import {
  ImageFile,
  ImageFormat,
  convertImage,
  imagesToPDF,
  shareFile,
  saveToDownloads,
  formatBytes,
} from '../../utils/converter';
import {COLORS, RADIUS, SPACING} from '../../utils/theme';
import {
  AppButton,
  FormatChip,
  ProgressBar,
  SectionLabel,
  StatCard,
  Toggle,
} from '../../components/UIComponents';
import ImageCard from '../../ProgressBar/ImageCard';
import ResultItem from '../../ProgressBar/ResultItem';

type Tab = 'convert' | 'pdf';

interface Result {
  id: string;
  name: string;
  uri: string;
  size: number;
  type: 'image' | 'pdf';
  mimeType: string;
}

export default function Content() {
  const [tab, setTab] = useState<Tab>('convert');
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('PNG');
  const [quality, setQuality] = useState(90);
  const [autoRename, setAutoRename] = useState(true);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [totalConverted, setTotalConverted] = useState(0);

  // ── Pick images from gallery ──────────────────────────────────
  const pickImages = useCallback(async () => {
    try {
      const picked = await launchImageLibrary({
        mediaType: 'photo',
        multiple: true,
        includeBase64: false,
      });

      if (!picked.assets?.length) return;

      const newFiles: ImageFile[] = picked.assets.map(asset => ({
        id: Math.random().toString(36).slice(2),
        uri: asset.uri ?? '',
        name: asset.fileName ?? `image_${Date.now()}.jpg`,
        size: asset.fileSize ?? 0,
        type: asset.type ?? 'image/jpeg',
        status: 'ready',
      }));

      setFiles(prev => [...prev, ...newFiles]);
      setResults([]);
    } catch (err: any) {
      if (!err?.message?.includes('cancelled')) {
        Alert.alert('Error', 'Could not open image picker');
      }
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // ── Convert images to selected format ────────────────────────
  const handleConvert = async () => {
    if (!files.length) return;
    setConverting(true);
    setProgress(0);
    setResults([]);

    const newResults: Result[] = [];

    if (tab === 'pdf') {
      // ─ PDF mode ─
      setFiles(prev => prev.map(f => ({...f, status: 'converting'})));

      const result = await imagesToPDF(files, quality, pct => {
        setProgress(pct);
      });

      if (result.success) {
        newResults.push({
          id: 'pdf_' + Date.now(),
          name: result.outputName,
          uri: result.outputUri,
          size: result.outputSize,
          type: 'pdf',
          mimeType: 'application/pdf',
        });
        setFiles(prev => prev.map(f => ({...f, status: 'done'})));
        setTotalConverted(c => c + files.length);
      } else {
        Alert.alert('PDF Error', result.error ?? 'Failed to create PDF');
        setFiles(prev => prev.map(f => ({...f, status: 'error'})));
      }
    } else {
      // ─ Format convert mode ─
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setFiles(prev =>
          prev.map(x => (x.id === f.id ? {...x, status: 'converting'} : x)),
        );

        const result = await convertImage(f, targetFormat, quality);
        const pct = Math.round(((i + 1) / files.length) * 100);
        setProgress(pct);

        if (result.success) {
          const ext =
            targetFormat === 'JPEG' ? 'jpg' : targetFormat.toLowerCase();
          const outputName = autoRename
            ? f.name.replace(/\.[^.]+$/, `.${ext}`)
            : `converted_${i + 1}.${ext}`;

          newResults.push({
            id: f.id,
            name: outputName,
            uri: result.outputUri,
            size: result.outputSize,
            type: 'image',
            mimeType:
              targetFormat === 'PNG'
                ? 'image/png'
                : targetFormat === 'WEBP'
                ? 'image/webp'
                : 'image/jpeg',
          });

          setFiles(prev =>
            prev.map(x =>
              x.id === f.id
                ? {...x, status: 'done', outputUri: result.outputUri, outputSize: result.outputSize}
                : x,
            ),
          );
        } else {
          setFiles(prev =>
            prev.map(x => (x.id === f.id ? {...x, status: 'error'} : x)),
          );
        }
      }

      setTotalConverted(c => c + newResults.length);
    }

    setResults(newResults);
    setConverting(false);
  };

  // ── Download / Share ──────────────────────────────────────────
  const handleSave = async (result: Result) => {
    try {
      const dest = await saveToDownloads(result.uri, result.name);
      Alert.alert('Saved!', `File saved to:\n${dest}`);
    } catch {
      Alert.alert('Error', 'Could not save the file');
    }
  };

  const handleShare = async (result: Result) => {
    try {
      await shareFile(result.uri, result.name, result.mimeType);
    } catch {
      Alert.alert('Error', 'Could not share the file');
    }
  };

  const handleDownloadAll = async () => {
    if (!results.length) return;
    let saved = 0;
    for (const r of results) {
      try {
        await saveToDownloads(r.uri, r.name);
        saved++;
      } catch {}
    }
    Alert.alert('Done', `${saved}/${results.length} files saved to Downloads`);
  };

  const handleShareAll = async () => {
    // Share first file + note if multiple
    if (!results.length) return;
    if (results.length === 1) {
      await handleShare(results[0]);
      return;
    }
    // For multiple files, share them one by one
    for (const r of results) {
      await shareFile(r.uri, r.name, r.mimeType);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setFiles([]);
    setResults([]);
    setProgress(0);
    if (t === 'pdf') setTargetFormat('PNG');
  };

  const convertBtnLabel = () => {
    if (converting) return `Converting… ${progress}%`;
    if (tab === 'pdf')
      return `📄 Create PDF from ${files.length} image${files.length !== 1 ? 's' : ''}`;
    return `🔄 Convert ${files.length} image${files.length !== 1 ? 's' : ''} → ${targetFormat}`;
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      {/* ── Header ── */}
      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeTxt}>⚡ IMAGE STUDIO</Text>
      </View>
      <Text style={styles.title}>Image Converter</Text>
      <Text style={styles.subtitle}>JPG · PNG · JPEG · WEBP · PDF</Text>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <StatCard value={totalConverted} label="Converted" />
        <StatCard value={files.length} label="Queued" />
        <StatCard value={results.length} label="Ready" />
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'convert' && styles.tabActive]}
          onPress={() => switchTab('convert')}
          activeOpacity={0.8}>
          <Text style={[styles.tabTxt, tab === 'convert' && styles.tabTxtActive]}>
            🔄 Format Convert
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'pdf' && styles.tabActive]}
          onPress={() => switchTab('pdf')}
          activeOpacity={0.8}>
          <Text style={[styles.tabTxt, tab === 'pdf' && styles.tabTxtActive]}>
            📄 Image → PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Pick Images Button ── */}
      <TouchableOpacity
        style={styles.dropZone}
        onPress={pickImages}
        activeOpacity={0.8}>
        <Text style={styles.dropIcon}>{tab === 'pdf' ? '🖼️' : '📂'}</Text>
        <Text style={styles.dropTitle}>Tap to choose images</Text>
        <Text style={styles.dropSub}>
          JPG · PNG · JPEG · WEBP · GIF supported
        </Text>
      </TouchableOpacity>

      {/* ── Format selector (convert tab only) ── */}
      {tab === 'convert' && (
        <View style={styles.panel}>
          <SectionLabel text="Convert To" />
          <View style={styles.chips}>
            {(['JPG', 'PNG', 'JPEG', 'WEBP'] as ImageFormat[]).map(f => (
              <FormatChip
                key={f}
                label={f}
                selected={targetFormat === f}
                onPress={() => setTargetFormat(f)}
              />
            ))}
          </View>
        </View>
      )}

      {/* ── Image grid ── */}
      {files.length > 0 && (
        <View style={styles.grid}>
          {files.map(f => (
            <ImageCard
              key={f.id}
              item={f}
              onRemove={removeFile}
            />
          ))}
        </View>
      )}

      {/* ── Options panel ── */}
      <View style={styles.panel}>
        <SectionLabel text="Options" />

        <View style={styles.optRow}>
          <View>
            <Text style={styles.optLabel}>Quality: {quality}%</Text>
            <Text style={styles.optSub}>Higher = better quality, larger file</Text>
          </View>
        </View>

        {/* Custom slider using buttons */}
        <View style={styles.sliderRow}>
          {[10, 25, 50, 75, 90, 100].map(v => (
            <TouchableOpacity
              key={v}
              onPress={() => setQuality(v)}
              style={[
                styles.sliderBtn,
                quality === v && {
                  backgroundColor: COLORS.accent,
                  borderColor: COLORS.accent,
                },
              ]}>
              <Text
                style={[
                  styles.sliderBtnTxt,
                  quality === v && {color: COLORS.white},
                ]}>
                {v}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.optRow}>
          <View>
            <Text style={styles.optLabel}>Auto-rename files</Text>
            <Text style={styles.optSub}>Match extension to format</Text>
          </View>
          <Toggle value={autoRename} onChange={setAutoRename} />
        </View>
      </View>

      {/* ── Progress bar ── */}
      {converting && <ProgressBar value={progress} />}

      {/* ── Convert button ── */}
      <AppButton
        label={convertBtnLabel()}
        onPress={handleConvert}
        disabled={!files.length || converting}
        loading={converting}
        style={styles.convertBtn}
      />

      {/* ── Results panel ── */}
      {results.length > 0 && (
        <View style={styles.resultsPanel}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTick}>✅</Text>
            <Text style={styles.resultsTitle}>
              Conversion Complete! {results.length} file{results.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {results.map(r => (
            <ResultItem
              key={r.id}
              name={r.name}
              size={r.size}
              type={r.type}
              onSave={() => handleSave(r)}
              onShare={() => handleShare(r)}
            />
          ))}

          {/* Download All */}
          {results.length >= 1 && (
            <View style={styles.allBtnsRow}>
              <AppButton
                label={`↓ Save All (${results.length})`}
                onPress={handleDownloadAll}
                variant="success"
                style={styles.allBtn}
              />
              <AppButton
                label="⬆ Share All"
                onPress={handleShareAll}
                variant="outline"
                style={styles.allBtn}
              />
            </View>
          )}
        </View>
      )}

      {files.length === 0 && (
        <Text style={styles.empty}>
          No images added yet — tap above to begin
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1, backgroundColor: COLORS.bg},
  container: {padding: SPACING.md, paddingBottom: 60},

  // Header
  headerBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(124,106,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,106,247,0.3)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 14,
    marginTop: 8,
  },
  headerBadgeTxt: {
    color: COLORS.accent,
    fontSize: 10,
    fontFamily: 'Courier New',
    letterSpacing: 3,
    fontWeight: '600',
  },
  title: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: 'Courier New',
    marginBottom: SPACING.lg,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  tabActive: {backgroundColor: COLORS.accent},
  tabTxt: {color: COLORS.muted, fontSize: 13, fontWeight: '600'},
  tabTxtActive: {color: COLORS.white},

  // Drop zone
  dropZone: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    padding: 40,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
  },
  dropIcon: {fontSize: 48, marginBottom: 10},
  dropTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  dropSub: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
  },

  // Panel
  panel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},

  // Image grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },

  // Options
  optRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  optLabel: {color: COLORS.text, fontSize: 13, fontWeight: '600'},
  optSub: {
    color: COLORS.muted,
    fontSize: 11,
    fontFamily: 'Courier New',
    marginTop: 2,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 4,
  },
  sliderBtn: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  sliderBtnTxt: {
    color: COLORS.muted,
    fontSize: 11,
    fontFamily: 'Courier New',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  // Convert button
  convertBtn: {marginBottom: SPACING.md},

  // Results
  resultsPanel: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  resultsTick: {fontSize: 18},
  resultsTitle: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '700',
  },
  allBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  allBtn: {flex: 1},

  // Empty
  empty: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
    marginTop: SPACING.md,
  },
});