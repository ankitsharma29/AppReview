// src/screens/Content.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { requestPhotoPermission } from '../../utils/permissions';
import {
  ImageFile,
  ImageFormat,
  convertImage,
  imagesToPDF,
  shareFile,
  saveToDownloads,
} from '../../utils/converter';
import { COLORS, RADIUS, SPACING } from '../../utils/theme';
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
import Header from '../../components/Header';
import { useIsFocused } from '@react-navigation/native';
import { interstitial } from '../../components/Ads/adMethods';

type Tab = 'convert' | 'pdf';

interface Result {
  id: string;
  name: string;
  uri: string;
  size: number;
  type: 'image' | 'pdf';
  mimeType: string;
}

export default function Content({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('convert');
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('PNG');
  const [quality, setQuality] = useState(90);
  const [autoRename, setAutoRename] = useState(true);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [totalConverted, setTotalConverted] = useState(0);

  // Request permission on mount
  useEffect(() => {
    requestPhotoPermission();
  }, []);

  // Pick images from gallery
  const pickImages = useCallback(async () => {
    const granted = await requestPhotoPermission();
    if (!granted) return;

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 0,
        includeBase64: false,
        quality: 1,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert(
            'Picker Error',
            response.errorMessage ?? 'Could not open image library',
          );
          return;
        }
        const assets = response.assets ?? [];
        if (!assets.length) return;

        const newFiles: ImageFile[] = assets.map(asset => ({
          id: Math.random().toString(36).slice(2) + Date.now(),
          uri: asset.uri ?? '',
          name: asset.fileName ?? `image_${Date.now()}.jpg`,
          size: asset.fileSize ?? 0,
          type: asset.type ?? 'image/jpeg',
          status: 'ready',
        }));

        setFiles(prev => [...prev, ...newFiles]);
        setResults([]);
      },
    );
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setResults([]);
    setProgress(0);
  }, []);

  // Main conversion logic
  const handleConvert = async () => {
    if (!files.length) return;
    setConverting(true);
    setProgress(0);
    setResults([]);
    const newResults: Result[] = [];

    try {
      if (tab === 'pdf') {
        setFiles(prev => prev.map(f => ({ ...f, status: 'converting' })));
        const result = await imagesToPDF(files, quality, pct =>
          setProgress(pct),
        );

        if (result.success) {
          newResults.push({
            id: `pdf_${Date.now()}`,
            name: result.outputName,
            uri: result.outputUri,
            size: result.outputSize,
            type: 'pdf',
            mimeType: 'application/pdf',
          });
          setFiles(prev => prev.map(f => ({ ...f, status: 'done' })));
          setTotalConverted(c => c + files.length);
        } else {
          Alert.alert('PDF Error', result.error ?? 'Failed to create PDF');
          setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
        }
      } else {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          setFiles(prev =>
            prev.map(x => (x.id === f.id ? { ...x, status: 'converting' } : x)),
          );

          const result = await convertImage(f, targetFormat, quality);
          setProgress(Math.round(((i + 1) / files.length) * 100));

          if (result.success) {
            const ext =
              targetFormat === 'JPEG' ? 'jpg' : targetFormat.toLowerCase();
            const outputName = autoRename
              ? f.name.replace(/\.[^.]+$/, `.${ext}`)
              : `converted_${i + 1}_${Date.now()}.${ext}`;

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
                  ? {
                      ...x,
                      status: 'done',
                      outputUri: result.outputUri,
                      outputSize: result.outputSize,
                    }
                  : x,
              ),
            );
          } else {
            setFiles(prev =>
              prev.map(x => (x.id === f.id ? { ...x, status: 'error' } : x)),
            );
          }
        }
        setTotalConverted(c => c + newResults.length);
      }
    } catch (err: any) {
      Alert.alert('Unexpected Error', err?.message ?? 'Something went wrong');
    }

    setResults(newResults);
    setConverting(false);
  };

  const handleSave = async (result: Result) => {
    try {
      const dest = await saveToDownloads(result.uri, result.name);
      const shortPath = dest.split('/').slice(-3).join('/');
      Alert.alert('✅ Saved!', `Saved to:\n…/${shortPath}`);
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message ?? 'Could not save the file');
    }
  };

  const handleShare = async (result: Result) => {
    try {
      await shareFile(result.uri, result.name, result.mimeType);
    } catch (err: any) {
      if (!String(err?.message).includes('cancel')) {
        Alert.alert('Share Failed', err?.message ?? 'Could not share the file');
      }
    }
  };

  const handleSaveAll = async () => {
    if (!results.length) return;
    let saved = 0;
    const errors: string[] = [];
    for (const r of results) {
      try {
        await saveToDownloads(r.uri, r.name);
        saved++;
      } catch (err: any) {
        errors.push(err?.message ?? r.name);
      }
    }
    if (errors.length) {
      Alert.alert(
        'Partial Save',
        `${saved}/${results.length} saved.\nFailed: ${errors.join(', ')}`,
      );
    } else {
      Alert.alert(
        '✅ All Saved!',
        `${saved} file${saved !== 1 ? 's' : ''} saved to ${
          Platform.OS === 'android' ? 'Downloads' : 'Files app'
        }`,
      );
    }
  };

  const handleShareAll = async () => {
    for (const r of results) {
      try {
        await shareFile(r.uri, r.name, r.mimeType);
      } catch {
        // skip cancelled
      }
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setFiles([]);
    setResults([]);
    setProgress(0);
  };

  const convertBtnLabel = () => {
    if (converting) return `Converting… ${progress}%`;
    if (tab === 'pdf')
      return `📄 Create PDF  (${files.length} image${
        files.length !== 1 ? 's' : ''
      })`;
    return `🔄 Convert to ${targetFormat}  (${files.length} image${
      files.length !== 1 ? 's' : ''
    })`;
  };

  // ads
  const isFocused = useIsFocused();
  useEffect(() => {
    interstitial.load();
  }, [isFocused]);

  useEffect(() => {
    try {
      setTimeout(() => {
        if (isFocused == true) {
          (async () => {
            await interstitial.show();
          })();
        }
      }, 5000);
    } catch (error) {}
  }, [isFocused]);
  return (
    <>
      <Header navigation={navigation} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>⚡ IMAGE STUDIO</Text>
        </View>
        <Text style={styles.title}>Image Converter</Text>
        <Text style={styles.subtitle}>JPG · PNG · JPEG · WEBP · PDF</Text>

        <View style={styles.statsRow}>
          <StatCard value={totalConverted} label="Converted" />
          <StatCard value={files.length} label="Queued" />
          <StatCard value={results.length} label="Ready" />
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'convert' && styles.tabActive]}
            onPress={() => switchTab('convert')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.tabTxt, tab === 'convert' && styles.tabTxtActive]}
            >
              🔄 Format Convert
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'pdf' && styles.tabActive]}
            onPress={() => switchTab('pdf')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabTxt, tab === 'pdf' && styles.tabTxtActive]}>
              📄 Image → PDF
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dropZone}
          onPress={pickImages}
          activeOpacity={0.8}
        >
          <Text style={styles.dropIcon}>{tab === 'pdf' ? '🖼️' : '📂'}</Text>
          <Text style={styles.dropTitle}>Tap to choose images</Text>
          <Text style={styles.dropSub}>
            JPG · PNG · JPEG · WEBP · GIF supported
          </Text>
          {files.length > 0 && (
            <View style={styles.addMoreBadge}>
              <Text style={styles.addMoreTxt}>+ Add more</Text>
            </View>
          )}
        </TouchableOpacity>

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

        {files.length > 0 && (
          <>
            <View style={styles.gridHeader}>
              <Text style={styles.gridTitle}>
                {files.length} image{files.length !== 1 ? 's' : ''} queued
              </Text>
              <TouchableOpacity onPress={clearAll}>
                <Text style={styles.clearTxt}>Clear all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {files.map(f => (
                <ImageCard key={f.id} item={f} onRemove={removeFile} />
              ))}
            </View>
          </>
        )}

        <View style={styles.panel}>
          <SectionLabel text="Options" />
          <View style={styles.optRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optLabel}>Quality: {quality}%</Text>
              <Text style={styles.optSub}>
                Higher = better quality, larger file
              </Text>
            </View>
          </View>
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
                ]}
              >
                <Text
                  style={[
                    styles.sliderBtnTxt,
                    quality === v && { color: COLORS.white },
                  ]}
                >
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.divider} />
          <View style={styles.optRow}>
            <View>
              <Text style={styles.optLabel}>Auto-rename output files</Text>
              <Text style={styles.optSub}>
                Match filename extension to format
              </Text>
            </View>
            <Toggle value={autoRename} onChange={setAutoRename} />
          </View>
        </View>

        {converting && <ProgressBar value={progress} />}

        <AppButton
          label={convertBtnLabel()}
          onPress={handleConvert}
          disabled={!files.length || converting}
          loading={converting}
          style={styles.convertBtn}
        />

        {results.length > 0 && (
          <View style={styles.resultsPanel}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTick}>✅</Text>
              <Text style={styles.resultsTitle}>
                {results.length} file{results.length !== 1 ? 's' : ''} ready
              </Text>
            </View>
            {results.map(r => (
              <ResultItem
                key={r.id}
                name={r.name}
                size={r.size}
                type={r.type}
                item={r}
                onSave={() => handleSave(r)}
                onShare={() => handleShare(r)}
              />
            ))}
            <View style={styles.allBtnsRow}>
              <AppButton
                label={`↓ Save All (${results.length})`}
                onPress={handleSaveAll}
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
          </View>
        )}

        {files.length === 0 && results.length === 0 && (
          <Text style={styles.empty}>
            No images added yet — tap above to begin
          </Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: SPACING.md, paddingBottom: 60 },
  badge: {
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
  badgeTxt: {
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
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
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
  tabActive: { backgroundColor: COLORS.accent },
  tabTxt: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  tabTxtActive: { color: COLORS.white },
  dropZone: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    padding: 36,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
  },
  dropIcon: { fontSize: 44, marginBottom: 10 },
  dropTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  dropSub: { color: COLORS.muted, fontSize: 12, fontFamily: 'Courier New' },
  addMoreBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(124,106,247,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  addMoreTxt: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
  panel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridTitle: { color: COLORS.muted, fontSize: 12, fontFamily: 'Courier New' },
  clearTxt: { color: COLORS.accent2, fontSize: 12, fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  optRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  optLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
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
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  convertBtn: { marginBottom: SPACING.md },
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
  resultsTick: { fontSize: 18 },
  resultsTitle: { color: COLORS.success, fontSize: 14, fontWeight: '700' },
  allBtnsRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.md },
  allBtn: { flex: 1 },
  empty: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: 'Courier New',
    marginTop: SPACING.md,
  },
});
