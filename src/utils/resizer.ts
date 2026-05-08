// src/utils/resizer.ts
//
// Smart image & PDF resizer:
//  - Image: iteratively adjusts JPEG quality + pixel dimensions
//    until the output file is ≤ the user-specified target size.
//  - PDF: rebuilds the PDF with lower-quality JPEG embeds until
//    the output file is ≤ the user-specified target size.

import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import {requestWritePermission} from './permissions';

// ─────────────────────────────────────────────
// Helpers shared with converter.ts
// ─────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function stripScheme(uri: string): string {
  if (!uri) return '';
  return uri.replace(/^file:\/\/\//, '/').replace(/^file:\/\//, '');
}

export function addScheme(path: string): string {
  if (!path) return '';
  return path.startsWith('file://') ? path : `file://${path}`;
}

export function getOutputDir(): string {
  if (Platform.OS === 'android') {
    return (
      RNFS.DownloadDirectoryPath ??
      RNFS.ExternalStorageDirectoryPath ??
      RNFS.DocumentDirectoryPath
    );
  }
  return RNFS.DocumentDirectoryPath;
}

// ─────────────────────────────────────────────
// Target size units
// ─────────────────────────────────────────────
export type SizeUnit = 'KB' | 'MB';

export function toBytes(value: number, unit: SizeUnit): number {
  return unit === 'MB' ? value * 1024 * 1024 : value * 1024;
}

// ─────────────────────────────────────────────
// Image resize result
// ─────────────────────────────────────────────
export interface ResizeResult {
  success: boolean;
  outputUri: string;
  outputName: string;
  originalSize: number;
  outputSize: number;
  savedPercent: number;
  finalQuality: number;
  error?: string;
}

export interface ImageFileItem {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
  status: 'ready' | 'processing' | 'done' | 'error';
  outputUri?: string;
  outputSize?: number;
  savedPercent?: number;
}

// ─────────────────────────────────────────────
// Resize a single image to target size
//
// Strategy:
//   1. Start at quality=85, maxDim=original
//   2. Encode → check size
//   3. If too large: drop quality by 10, if still too large halve maxDim
//   4. Repeat up to MAX_ITERATIONS times
//   5. Return best result found
// ─────────────────────────────────────────────
const MAX_ITERATIONS = 12;

export async function resizeImageToTarget(
  uri: string,
  originalName: string,
  targetBytes: number,
  onProgress?: (pct: number) => void,
): Promise<ResizeResult> {
  try {
    if (!uri) throw new Error('No URI provided');

    const srcPath = stripScheme(uri);
    if (!(await RNFS.exists(srcPath))) throw new Error('Source file not found');

    const srcStat = await RNFS.stat(srcPath);
    const originalSize = Number(srcStat.size);

    // Already small enough — copy as-is
    if (originalSize <= targetBytes) {
      const ext = originalName.split('.').pop()?.toLowerCase() ?? 'jpg';
      const destName = originalName.replace(/\.[^.]+$/, `_resized.${ext}`);
      const destPath = `${RNFS.CachesDirectoryPath}/${Date.now()}_${destName}`;
      await RNFS.copyFile(srcPath, destPath);
      onProgress?.(100);
      return {
        success: true,
        outputUri: addScheme(destPath),
        outputName: destName,
        originalSize,
        outputSize: originalSize,
        savedPercent: 0,
        finalQuality: 100,
      };
    }

    let quality = 85;
    let maxDim = 4096;
    let bestPath = '';
    let bestSize = Infinity;
    let bestQuality = quality;
    const tempPaths: string[] = [];

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      onProgress?.(Math.round((iter / MAX_ITERATIONS) * 90));

      let resized: {uri: string} | null = null;
      try {
        resized = await ImageResizer.createResizedImage(
          addScheme(uri),
          maxDim,
          maxDim,
          'JPEG',
          quality,
          0,
          RNFS.CachesDirectoryPath,
          false,
          {mode: 'contain', onlyScaleDown: false},
        );
      } catch (e: any) {
        // If resizer fails at very low quality/dim, stop
        break;
      }

      if (!resized?.uri) break;

      const p = stripScheme(resized.uri);
      tempPaths.push(p);

      if (!(await RNFS.exists(p))) break;
      const s = await RNFS.stat(p);
      const sz = Number(s.size);

      if (sz < bestSize) {
        bestSize = sz;
        bestPath = p;
        bestQuality = quality;
      }

      if (sz <= targetBytes) break; // ✓ target reached

      // Reduce aggressively if still far from target
      const ratio = sz / targetBytes;
      if (ratio > 4) {
        quality = Math.max(10, quality - 25);
        maxDim = Math.max(256, Math.round(maxDim * 0.6));
      } else if (ratio > 2) {
        quality = Math.max(10, quality - 15);
        maxDim = Math.max(256, Math.round(maxDim * 0.75));
      } else {
        quality = Math.max(10, quality - 8);
      }
    }

    onProgress?.(95);

    if (!bestPath || !(await RNFS.exists(bestPath))) {
      throw new Error('Resize produced no output');
    }

    // Move best result to a named file
    const ext = 'jpg';
    const baseName = originalName.replace(/\.[^.]+$/, '');
    const destName = `${baseName}_resized.${ext}`;
    const destPath = `${RNFS.CachesDirectoryPath}/${Date.now()}_${destName}`;
    await RNFS.copyFile(bestPath, destPath);

    // Clean up all temp files
    for (const p of tempPaths) {
      try { await RNFS.unlink(p); } catch {}
    }

    const stat = await RNFS.stat(destPath);
    const outputSize = Number(stat.size);
    const savedPercent = Math.round(((originalSize - outputSize) / originalSize) * 100);

    onProgress?.(100);

    return {
      success: true,
      outputUri: addScheme(destPath),
      outputName: destName,
      originalSize,
      outputSize,
      savedPercent: Math.max(0, savedPercent),
      finalQuality: bestQuality,
    };
  } catch (err: any) {
    console.error('resizeImageToTarget error:', err);
    return {
      success: false,
      outputUri: '',
      outputName: '',
      originalSize: 0,
      outputSize: 0,
      savedPercent: 0,
      finalQuality: 0,
      error: err?.message ?? 'Resize failed',
    };
  }
}

// ─────────────────────────────────────────────
// base64 ↔ bytes (no native deps)
// ─────────────────────────────────────────────
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor(clean.length * 3 / 4));
  let j = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64.indexOf(clean[i]);
    const b = B64.indexOf(clean[i + 1]);
    const c = B64.indexOf(clean[i + 2] ?? 'A');
    const d = B64.indexOf(clean[i + 3] ?? 'A');
    out[j++] = (a << 2) | (b >> 4);
    if (clean[i + 2] && clean[i + 2] !== '=') out[j++] = ((b & 0xf) << 4) | (c >> 2);
    if (clean[i + 3] && clean[i + 3] !== '=') out[j++] = ((c & 3) << 6) | d;
  }
  return out.slice(0, j);
}

export function bytesToB64(bytes: Uint8Array): string {
  let b64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1] ?? 0, b2 = bytes[i + 2] ?? 0;
    b64 += B64[b0 >> 2];
    b64 += B64[((b0 & 3) << 4) | (b1 >> 4)];
    b64 += i + 1 < bytes.length ? B64[((b1 & 0xf) << 2) | (b2 >> 6)] : '=';
    b64 += i + 2 < bytes.length ? B64[b2 & 0x3f] : '=';
  }
  return b64;
}

// ─────────────────────────────────────────────
// Parse JPEG dimensions from raw bytes
// ─────────────────────────────────────────────
export function parseJpegDimensions(bytes: Uint8Array): {w: number; h: number} {
  for (let i = 2; i < bytes.length - 8; i++) {
    if (bytes[i] === 0xff) {
      const m = bytes[i + 1];
      if (m >= 0xc0 && m <= 0xc3) {
        const h = (bytes[i + 5] << 8) | bytes[i + 6];
        const w = (bytes[i + 7] << 8) | bytes[i + 8];
        if (w > 0 && h > 0) return {w, h};
      }
    }
  }
  return {w: 800, h: 600};
}

// ─────────────────────────────────────────────
// PDF builder (same as converter.ts)
// ─────────────────────────────────────────────
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;

function fitToPage(w: number, h: number) {
  const maxW = PAGE_W - MARGIN * 2;
  const maxH = PAGE_H - MARGIN * 2;
  const scale = Math.min(maxW / w, maxH / h, 1);
  const pw = Math.round(w * scale);
  const ph = Math.round(h * scale);
  return {
    x: Math.round(MARGIN + (maxW - pw) / 2),
    y: Math.round(MARGIN + (maxH - ph) / 2),
    pw,
    ph,
  };
}

function appendStr(arr: number[], s: string) {
  for (let i = 0; i < s.length; i++) arr.push(s.charCodeAt(i) & 0xff);
}
function appendBytes(arr: number[], b: Uint8Array) {
  for (let i = 0; i < b.length; i++) arr.push(b[i]);
}

function buildPDF(jpegs: Array<{bytes: Uint8Array; w: number; h: number}>): Uint8Array {
  const out: number[] = [];
  const xref: number[] = [];

  const str = (s: string) => appendStr(out, s);
  const raw = (b: Uint8Array) => appendBytes(out, b);
  const pos = () => out.length;

  const startObj = (n: number) => { xref[n] = pos(); str(`${n} 0 obj\n`); };
  const endObj = () => str('\nendobj\n');

  str('%PDF-1.4\n%\xFF\xFE\xFD\xFC\n');

  const n = jpegs.length;
  const imgObj  = (i: number) => 3 + i * 3;
  const contObj = (i: number) => 3 + i * 3 + 1;
  const pageObj = (i: number) => 3 + i * 3 + 2;
  const total   = 3 + n * 3;

  startObj(1); str(`<< /Type /Catalog /Pages 2 0 R >>`); endObj();
  startObj(2);
  str(`<< /Type /Pages /Kids [${Array.from({length: n}, (_, i) => `${pageObj(i)} 0 R`).join(' ')}] /Count ${n} >>`);
  endObj();

  for (let i = 0; i < n; i++) {
    const {bytes, w, h} = jpegs[i];
    const {x, y, pw, ph} = fitToPage(w, h);

    startObj(imgObj(i));
    str(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
    raw(bytes);
    str('\nendstream');
    endObj();

    const cs = `q\n${pw} 0 0 ${ph} ${x} ${y} cm\n/Im${i} Do\nQ\n`;
    startObj(contObj(i));
    str(`<< /Length ${cs.length} >>\nstream\n${cs}endstream`);
    endObj();

    startObj(pageObj(i));
    str(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /XObject << /Im${i} ${imgObj(i)} 0 R >> >> /Contents ${contObj(i)} 0 R >>`);
    endObj();
  }

  const xrefPos = pos();
  str(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
  for (let k = 1; k <= total; k++) {
    str(`${String(xref[k] ?? 0).padStart(10, '0')} 00000 n \n`);
  }
  str(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  return new Uint8Array(out);
}

// ─────────────────────────────────────────────
// PDF resize result
// ─────────────────────────────────────────────
export interface PdfResizeResult {
  success: boolean;
  outputUri: string;
  outputName: string;
  originalSize: number;
  outputSize: number;
  savedPercent: number;
  pageCount: number;
  finalQuality: number;
  error?: string;
}

export interface PdfSourceImage {
  uri: string;
  name: string;
  size: number;
}

// ─────────────────────────────────────────────
// Resize PDF by re-encoding embedded images
//
// The user provides source images (same as imagesToPDF).
// We iterate quality down until PDF ≤ targetBytes.
// ─────────────────────────────────────────────
export async function resizePdfToTarget(
  images: PdfSourceImage[],
  targetBytes: number,
  onProgress?: (pct: number) => void,
): Promise<PdfResizeResult> {
  try {
    if (!images?.length) throw new Error('No images provided');

    onProgress?.(3);

    let quality = 80;
    let maxDim = 1600;
    let bestPdfBytes: Uint8Array | null = null;
    let bestSize = Infinity;
    let bestQuality = quality;
    const ITER = 10;

    for (let iter = 0; iter < ITER; iter++) {
      onProgress?.(3 + Math.round((iter / ITER) * 85));

      // Encode all images at current quality/dim
      const jpegs: Array<{bytes: Uint8Array; w: number; h: number}> = [];
      let encFailed = false;

      for (const img of images) {
        let jpegPath = stripScheme(img.uri);
        let tempPath: string | null = null;

        try {
          const r = await ImageResizer.createResizedImage(
            addScheme(img.uri), maxDim, maxDim, 'JPEG', quality, 0,
            RNFS.CachesDirectoryPath, false, {mode: 'contain', onlyScaleDown: false},
          );
          if (r?.uri) {
            jpegPath = stripScheme(r.uri);
            tempPath = jpegPath;
          }
        } catch {}

        if (!(await RNFS.exists(jpegPath))) { encFailed = true; break; }

        const b64 = await RNFS.readFile(jpegPath, 'base64');
        const bytes = b64ToBytes(b64);
        const {w, h} = parseJpegDimensions(bytes);
        jpegs.push({bytes, w, h});

        if (tempPath) {
          try { await RNFS.unlink(tempPath); } catch {}
        }
      }

      if (encFailed || !jpegs.length) break;

      const pdfBytes = buildPDF(jpegs);
      const sz = pdfBytes.length;

      if (sz < bestSize) {
        bestSize = sz;
        bestPdfBytes = pdfBytes;
        bestQuality = quality;
      }

      if (sz <= targetBytes) break;

      // Reduce strategy
      const ratio = sz / targetBytes;
      if (ratio > 3) {
        quality = Math.max(10, quality - 20);
        maxDim  = Math.max(300, Math.round(maxDim * 0.65));
      } else if (ratio > 1.5) {
        quality = Math.max(10, quality - 12);
        maxDim  = Math.max(300, Math.round(maxDim * 0.8));
      } else {
        quality = Math.max(10, quality - 6);
      }
    }

    onProgress?.(92);

    if (!bestPdfBytes) throw new Error('PDF resize produced no output');

    // Get original PDF size for comparison
    const originalSize = images.reduce((sum, img) => sum + (img.size ?? 0), 0);

    // Write to disk
    const fileName = `resized_pdf_${Date.now()}.pdf`;
    const outPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
    await RNFS.writeFile(outPath, bytesToB64(bestPdfBytes), 'base64');

    if (!(await RNFS.exists(outPath))) throw new Error('PDF not written to disk');

    const stat = await RNFS.stat(outPath);
    const outputSize = Number(stat.size);
    const savedPercent = originalSize > 0
      ? Math.max(0, Math.round(((originalSize - outputSize) / originalSize) * 100))
      : 0;

    onProgress?.(100);

    return {
      success: true,
      outputUri: addScheme(outPath),
      outputName: `resized_${images.length}pages_${Date.now()}.pdf`,
      originalSize,
      outputSize,
      savedPercent,
      pageCount: images.length,
      finalQuality: bestQuality,
    };
  } catch (err: any) {
    console.error('resizePdfToTarget error:', err);
    return {
      success: false,
      outputUri: '',
      outputName: '',
      originalSize: 0,
      outputSize: 0,
      savedPercent: 0,
      pageCount: 0,
      finalQuality: 0,
      error: err?.message ?? 'PDF resize failed',
    };
  }
}

// ─────────────────────────────────────────────
// Save to Downloads / Documents
// ─────────────────────────────────────────────
export async function saveResizedFile(uri: string, name: string): Promise<string> {
  if (!uri) throw new Error('No URI provided');

  const canWrite = await requestWritePermission();
  if (!canWrite) throw new Error('Storage permission denied');

  const srcPath = stripScheme(uri);
  if (!(await RNFS.exists(srcPath))) throw new Error('Source not found');

  const destDir = getOutputDir();
  if (!(await RNFS.exists(destDir))) await RNFS.mkdir(destDir);

  let destPath = `${destDir}/${name}`;
  if (await RNFS.exists(destPath)) {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext  = dot > 0 ? name.slice(dot) : '';
    destPath = `${destDir}/${base}_${Date.now()}${ext}`;
  }

  await RNFS.copyFile(srcPath, destPath);

  if (Platform.OS === 'android') {
    try { await RNFS.scanFile(destPath); } catch {}
  }

  return destPath;
}