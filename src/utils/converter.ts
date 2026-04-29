// src/utils/converter.ts
import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import Share from 'react-native-share';
import {requestWritePermission} from './permissions';

// ─── FIX 1: react-native-react-native-html-to-pdf has a broken default export in some
// versions. Use require() so we get the actual native module regardless
// of how the package exports itself.
const RNHTMLtoPDF = require('react-native-html-to-pdf').default ?? require('react-native-html-to-pdf');

export type ImageFormat = 'JPG' | 'PNG' | 'JPEG' | 'WEBP';

export interface ImageFile {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
  status: 'ready' | 'converting' | 'done' | 'error';
  outputUri?: string;
  outputSize?: number;
}

export interface ConvertResult {
  success: boolean;
  outputUri: string;
  outputName: string;
  outputSize: number;
  error?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function getExtension(name: string): string {
  return (name?.split('.').pop() ?? '').toUpperCase();
}

// Strip file:// — RNFS needs bare paths
function stripScheme(uri: string): string {
  return uri ? uri.replace(/^file:\/\/\//, '/').replace(/^file:\/\//, '') : '';
}

// Add file:// — Share / Image components need it
function addScheme(path: string): string {
  if (!path) return '';
  return path.startsWith('file://') ? path : `file://${path}`;
}

// Platform-aware output directory
function getOutputDir(): string {
  if (Platform.OS === 'android') {
    return (
      RNFS.DownloadDirectoryPath ??
      RNFS.ExternalStorageDirectoryPath ??
      RNFS.DocumentDirectoryPath
    );
  }
  // iOS: DocumentDirectory is visible in Files app (UIFileSharingEnabled)
  return RNFS.DocumentDirectoryPath;
}

// ─────────────────────────────────────────────
// Convert a single image to a different format
// ─────────────────────────────────────────────
export async function convertImage(
  file: ImageFile,
  targetFormat: ImageFormat,
  quality: number,
): Promise<ConvertResult> {
  try {
    if (!file?.uri) throw new Error('Invalid file — no URI provided');

    const rnFormat: 'JPEG' | 'PNG' | 'WEBP' =
      targetFormat === 'PNG' ? 'PNG' : targetFormat === 'WEBP' ? 'WEBP' : 'JPEG';

    // ── FIX 2: wrap ImageResizer call defensively ──────────────
    let resized: {uri: string} | null = null;
    try {
      resized = await ImageResizer.createResizedImage(
        addScheme(file.uri),
        4096,
        4096,
        rnFormat,
        quality,
        0,
        RNFS.CachesDirectoryPath,
        false,
        {mode: 'contain', onlyScaleDown: true},
      );
    } catch (resizerErr: any) {
      throw new Error(`ImageResizer failed: ${resizerErr?.message ?? resizerErr}`);
    }

    // ── FIX 3: guard against undefined result from resizer ─────
    if (!resized?.uri) {
      throw new Error('ImageResizer returned no output URI');
    }

    const ext = targetFormat === 'JPEG' ? 'jpg' : targetFormat.toLowerCase();
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const outputName = `${baseName}.${ext}`;
    const destPath = `${RNFS.CachesDirectoryPath}/${Date.now()}_${outputName}`;

    const resizedPath = stripScheme(resized.uri);

    // Verify the resizer actually wrote a file
    const resizedExists = await RNFS.exists(resizedPath);
    if (!resizedExists) throw new Error('ImageResizer output file not found on disk');

    await RNFS.moveFile(resizedPath, destPath);
    const stat = await RNFS.stat(destPath);

    return {
      success: true,
      outputUri: addScheme(destPath),
      outputName,
      outputSize: Number(stat.size),
    };
  } catch (err: any) {
    console.error('convertImage error:', err);
    return {
      success: false,
      outputUri: '',
      outputName: '',
      outputSize: 0,
      error: err?.message ?? 'Conversion failed',
    };
  }
}

// ─────────────────────────────────────────────
// Convert multiple images → single PDF
// ─────────────────────────────────────────────
export async function imagesToPDF(
  files: ImageFile[],
  quality: number,
  onProgress?: (pct: number) => void,
): Promise<ConvertResult> {
  try {
    console.log("files",files);
    
    if (!files?.length) throw new Error('No files provided');

    // ── FIX 4: verify RNHTMLtoPDF loaded correctly ─────────────
    if (!RNHTMLtoPDF || typeof RNHTMLtoPDF.convert !== 'function') {
      throw new Error(
        'react-native-html-to-pdf native module not linked. ' +
        'Run: cd android && ./gradlew clean, then rebuild.',
      );
    }

    // Step 1 — Base64-encode each image
    const base64Images: Array<{src: string; name: string}> = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];

      // ── FIX 5: guard each file's URI before using it ──────────
      if (!f?.uri) throw new Error(`File at index ${i} has no URI`);

      const filePath = stripScheme(f.uri);
      const exists = await RNFS.exists(filePath);
      if (!exists) throw new Error(`File not found on disk: ${f.name} (${filePath})`);

      const b64 = await RNFS.readFile(filePath, 'base64');
      if (!b64) throw new Error(`Could not read file: ${f.name}`);

      // Detect MIME type
      let mime = 'image/jpeg';
      const t = (f.type ?? '').toLowerCase();
      if (t.includes('png')) mime = 'image/png';
      else if (t.includes('webp')) mime = 'image/webp';
      else if (t.includes('gif')) mime = 'image/gif';

      // Detect from filename if type is missing/generic
      const ext = getExtension(f.name).toLowerCase();
      if (!t || t === 'image/*') {
        if (ext === 'png') mime = 'image/png';
        else if (ext === 'webp') mime = 'image/webp';
        else if (ext === 'gif') mime = 'image/gif';
      }

      base64Images.push({src: `data:${mime};base64,${b64}`, name: f.name});
      onProgress?.(Math.round(((i + 1) / files.length) * 60));
    }

    // Step 2 — Build HTML
    const pagesHtml = base64Images
      .map(
        ({src, name}, idx) =>
          `<div class="page">` +
          `<span class="pg">${idx + 1} / ${files.length}</span>` +
          `<img src="${src}" alt="Page ${idx + 1}"/>` +
          `<span class="nm">${name}</span>` +
          `</div>`,
      )
      .join('');

    const html =
      `<!DOCTYPE html><html><head><meta charset="utf-8"/>` +
      `<style>` +
      `*{margin:0;padding:0;box-sizing:border-box;}` +
      `body{background:#fff;font-family:Helvetica,Arial,sans-serif;}` +
      `.page{width:100%;min-height:100vh;display:flex;flex-direction:column;` +
      `align-items:center;justify-content:center;padding:24px;` +
      `page-break-after:always;position:relative;}` +
      `.page:last-child{page-break-after:auto;}` +
      `.pg{position:absolute;top:10px;right:14px;font-size:9px;color:#ccc;}` +
      `img{max-width:100%;max-height:85vh;object-fit:contain;display:block;}` +
      `.nm{margin-top:8px;font-size:9px;color:#bbb;text-align:center;}` +
      `</style></head><body>${pagesHtml}</body></html>`;

    onProgress?.(70);

    // Step 3 — Render HTML → PDF
    const fileName = `ImageConverter_${Date.now()}`;

    let pdfResult: {filePath?: string | null} | null = null;
    try {
      pdfResult = await RNHTMLtoPDF.convert({
        html,
        fileName,
        directory: 'Documents',
        base64: false,
      });
    } catch (pdfErr: any) {
      throw new Error(`PDF render failed: ${pdfErr?.message ?? pdfErr}`);
    }

    onProgress?.(90);

    // ── FIX 6: thorough null-check on pdfResult ───────────────
    if (!pdfResult) throw new Error('RNHTMLtoPDF.convert returned null');
    if (!pdfResult.filePath) throw new Error('PDF was created but filePath is missing');

    const pdfPath = pdfResult.filePath;
    const pdfExists = await RNFS.exists(pdfPath);
    if (!pdfExists) throw new Error(`PDF file not found at path: ${pdfPath}`);

    const stat = await RNFS.stat(pdfPath);
    onProgress?.(100);

    return {
      success: true,
      outputUri: addScheme(pdfPath),
      outputName: `converted_${files.length}pages_${Date.now()}.pdf`,
      outputSize: Number(stat.size),
    };
  } catch (err: any) {
    console.error('imagesToPDF error:', err);
    return {
      success: false,
      outputUri: '',
      outputName: '',
      outputSize: 0,
      error: err?.message ?? 'PDF creation failed',
    };
  }
}

// ─────────────────────────────────────────────
// Save file to Downloads / Documents
// ─────────────────────────────────────────────
export async function saveToDownloads(
  uri: string,
  name: string,
): Promise<string> {
  if (!uri) throw new Error('No URI provided to save');

  const canWrite = await requestWritePermission();
  if (!canWrite) throw new Error('Storage write permission denied');

  const srcPath = stripScheme(uri);
  const srcExists = await RNFS.exists(srcPath);
  if (!srcExists) throw new Error(`Source file not found: ${srcPath}`);

  const destDir = getOutputDir();
  const dirExists = await RNFS.exists(destDir);
  if (!dirExists) await RNFS.mkdir(destDir);

  // Collision-safe filename
  let destPath = `${destDir}/${name}`;
  const collision = await RNFS.exists(destPath);
  if (collision) {
    const dotIdx = name.lastIndexOf('.');
    const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
    const ext = dotIdx > 0 ? name.slice(dotIdx) : '';
    destPath = `${destDir}/${base}_${Date.now()}${ext}`;
  }

  await RNFS.copyFile(srcPath, destPath);

  // Android: trigger MediaStore scan so file appears in Files/Gallery
  if (Platform.OS === 'android') {
    try { await RNFS.scanFile(destPath); } catch { /* best-effort */ }
  }

  return destPath;
}

// ─────────────────────────────────────────────
// Share via native share sheet
// ─────────────────────────────────────────────
export async function shareFile(
  uri: string,
  name: string,
  mimeType: string,
): Promise<void> {
  if (!uri) throw new Error('No URI provided to share');

  const srcPath = stripScheme(uri);
  const exists = await RNFS.exists(srcPath);
  if (!exists) throw new Error(`File not found for sharing: ${srcPath}`);

  await Share.open({
    url: addScheme(srcPath),
    title: name,
    type: mimeType,
    failOnCancel: false,
    showAppsToView: true,
  });
}