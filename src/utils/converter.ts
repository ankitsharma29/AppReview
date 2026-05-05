// src/utils/converter.ts
//
// PDF generation strategy:
//   1. Convert every image → JPEG via ImageResizer
//   2. Read JPEG as base64 → decode to byte array
//   3. Parse JPEG header to get real width/height
//   4. Write a proper PDF 1.4 file:
//        - Each JPEG is embedded as a raw binary stream with /DCTDecode
//        - Written to disk via RNFS.writeFile with 'base64' encoding
//        - The PDF bytes are built as a number[] array, then base64-encoded
//
// No react-native-htmltopdf, no native PDF module needed.

import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import Share from 'react-native-share';
import {requestWritePermission} from './permissions';

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
  return (name.split('.').pop() ?? '').toUpperCase();
}

function stripScheme(uri: string): string {
  if (!uri) return '';
  return uri.replace(/^file:\/\/\//, '/').replace(/^file:\/\//, '');
}

function addScheme(path: string): string {
  if (!path) return '';
  return path.startsWith('file://') ? path : `file://${path}`;
}

function getOutputDir(): string {
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
// base64 ↔ byte array helpers
// (pure JS, no Buffer needed)
// ─────────────────────────────────────────────
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decode a base64 string to a Uint8Array */
function b64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let j = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64_CHARS.indexOf(clean[i]);
    const b = B64_CHARS.indexOf(clean[i + 1]);
    const c = B64_CHARS.indexOf(clean[i + 2] ?? 'A');
    const d = B64_CHARS.indexOf(clean[i + 3] ?? 'A');
    out[j++] = (a << 2) | (b >> 4);
    if (clean[i + 2] && clean[i + 2] !== '=') out[j++] = ((b & 0xf) << 4) | (c >> 2);
    if (clean[i + 3] && clean[i + 3] !== '=') out[j++] = ((c & 3) << 6) | d;
  }
  return out.slice(0, j);
}

/** Encode a Uint8Array to base64 */
function bytesToB64(bytes: Uint8Array): string {
  let b64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    b64 += B64_CHARS[b0 >> 2];
    b64 += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    b64 += i + 1 < bytes.length ? B64_CHARS[((b1 & 0xf) << 2) | (b2 >> 6)] : '=';
    b64 += i + 2 < bytes.length ? B64_CHARS[b2 & 0x3f] : '=';
  }
  return b64;
}

/** Append an ASCII string to a byte array */
function appendStr(arr: number[], s: string): void {
  for (let i = 0; i < s.length; i++) {
    arr.push(s.charCodeAt(i) & 0xff);
  }
}

/** Append a Uint8Array to a byte array */
function appendBytes(arr: number[], bytes: Uint8Array): void {
  for (let i = 0; i < bytes.length; i++) {
    arr.push(bytes[i]);
  }
}

// ─────────────────────────────────────────────
// Parse JPEG dimensions from raw bytes
// ─────────────────────────────────────────────
function parseJpegDimensions(bytes: Uint8Array): {w: number; h: number} {
  // Scan for SOF0 (0xFFC0), SOF1 (0xFFC1), SOF2 (0xFFC2) markers
  for (let i = 2; i < bytes.length - 8; i++) {
    if (bytes[i] === 0xff) {
      const marker = bytes[i + 1];
      if (marker >= 0xc0 && marker <= 0xc3) {
        // SOF marker: [FF][Cx][len_hi][len_lo][precision][height_hi][height_lo][width_hi][width_lo]
        const h = (bytes[i + 5] << 8) | bytes[i + 6];
        const w = (bytes[i + 7] << 8) | bytes[i + 8];
        if (w > 0 && h > 0) return {w, h};
      }
    }
  }
  return {w: 800, h: 600}; // safe fallback
}

// ─────────────────────────────────────────────
// Scale dimensions to fit A4 with margin
// ─────────────────────────────────────────────
const PAGE_W = 595;   // A4 width in PDF points  (72pt = 1 inch)
const PAGE_H = 842;   // A4 height in PDF points
const MARGIN = 40;    // 40pt ≈ 14mm margin on each side

function fitToPage(w: number, h: number): {x: number; y: number; pw: number; ph: number} {
  const maxW = PAGE_W - MARGIN * 2;
  const maxH = PAGE_H - MARGIN * 2;
  const scale = Math.min(maxW / w, maxH / h, 1); // never upscale
  const pw = Math.round(w * scale);
  const ph = Math.round(h * scale);
  const x = Math.round(MARGIN + (maxW - pw) / 2);
  const y = Math.round(MARGIN + (maxH - ph) / 2);
  return {x, y, pw, ph};
}

// ─────────────────────────────────────────────
// Core PDF binary builder
// Writes a valid PDF 1.4 with raw JPEG streams.
// Returns: Uint8Array of the complete PDF file.
// ─────────────────────────────────────────────
function buildPDF(jpegs: Array<{bytes: Uint8Array; w: number; h: number}>): Uint8Array {
  const out: number[] = [];       // accumulates raw bytes
  const xrefOffsets: number[] = []; // byte offset of each PDF object

  function str(s: string) { appendStr(out, s); }
  function raw(b: Uint8Array) { appendBytes(out, b); }
  function pos() { return out.length; }

  function startObj(n: number) {
    xrefOffsets[n] = pos();
    str(`${n} 0 obj\n`);
  }
  function endObj() { str('\nendobj\n'); }

  // ── PDF header ────────────────────────────────────────────
  str('%PDF-1.4\n');
  // Binary comment to signal binary file to viewers
  str('%\xFF\xFE\xFD\xFC\n');

  const n = jpegs.length;

  // Object layout:
  //  1         → Catalog
  //  2         → Pages
  //  3+i*3     → Image XObject for page i
  //  3+i*3+1   → Content stream for page i
  //  3+i*3+2   → Page object for page i

  const CATALOG  = 1;
  const PAGES    = 2;
  const imgObj   = (i: number) => 3 + i * 3;
  const contObj  = (i: number) => 3 + i * 3 + 1;
  const pageObj  = (i: number) => 3 + i * 3 + 2;
  const totalObj = 3 + n * 3;

  // ── Object 1: Catalog ─────────────────────────────────────
  startObj(CATALOG);
  str(`<< /Type /Catalog /Pages ${PAGES} 0 R >>`);
  endObj();

  // ── Object 2: Pages ──────────────────────────────────────
  startObj(PAGES);
  const kids = Array.from({length: n}, (_, i) => `${pageObj(i)} 0 R`).join(' ');
  str(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  endObj();

  // ── Per-page objects ──────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const {bytes, w, h} = jpegs[i];
    const {x, y, pw, ph} = fitToPage(w, h);

    // ── Image XObject (raw JPEG bytes, DCTDecode) ─────────
    startObj(imgObj(i));
    str(
      `<< /Type /XObject /Subtype /Image\n` +
      `/Width ${w} /Height ${h}\n` +
      `/ColorSpace /DeviceRGB\n` +
      `/BitsPerComponent 8\n` +
      `/Filter /DCTDecode\n` +
      `/Length ${bytes.length}\n` +
      `>>\n` +
      `stream\n`,
    );
    raw(bytes);             // ← raw JPEG bytes embedded directly
    str('\nendstream');
    endObj();

    // ── Content stream: draw the image ────────────────────
    const cs = `q\n${pw} 0 0 ${ph} ${x} ${y} cm\n/Im${i} Do\nQ\n`;
    startObj(contObj(i));
    str(`<< /Length ${cs.length} >>\nstream\n${cs}endstream`);
    endObj();

    // ── Page dictionary ───────────────────────────────────
    startObj(pageObj(i));
    str(
      `<< /Type /Page /Parent ${PAGES} 0 R\n` +
      `/MediaBox [0 0 ${PAGE_W} ${PAGE_H}]\n` +
      `/Resources << /XObject << /Im${i} ${imgObj(i)} 0 R >> >>\n` +
      `/Contents ${contObj(i)} 0 R\n` +
      `>>`,
    );
    endObj();
  }

  // ── xref table ────────────────────────────────────────────
  const xrefPos = pos();
  str(`xref\n0 ${totalObj + 1}\n`);
  str('0000000000 65535 f \n');
  for (let n = 1; n <= totalObj; n++) {
    str(`${String(xrefOffsets[n] ?? 0).padStart(10, '0')} 00000 n \n`);
  }

  // ── Trailer ───────────────────────────────────────────────
  str(
    `trailer\n<< /Size ${totalObj + 1} /Root ${CATALOG} 0 R >>\n` +
    `startxref\n${xrefPos}\n%%EOF\n`,
  );

  return new Uint8Array(out);
}

// ─────────────────────────────────────────────
// Convert images → PDF  (public API)
// ─────────────────────────────────────────────
export async function imagesToPDF(
  files: ImageFile[],
  quality: number,
  onProgress?: (pct: number) => void,
): Promise<ConvertResult> {
  try {
    if (!files?.length) throw new Error('No files provided');

    onProgress?.(5);

    const jpegs: Array<{bytes: Uint8Array; w: number; h: number}> = [];
    const tempPaths: string[] = [];

    // Step 1 — Convert every image to JPEG and read bytes
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f?.uri) throw new Error(`File ${i} has no URI`);

      let jpegPath = stripScheme(f.uri);

      // Re-encode as JPEG so we always have a clean DCT-compressed JPEG
      // regardless of the original format (PNG/WEBP/GIF/HEIC etc.)
      try {
        const resized = await ImageResizer.createResizedImage(
          addScheme(f.uri),
          2048,     // max dimension — keeps PDF file size manageable
          2048,
          'JPEG',
          Math.max(quality, 60), // minimum 60 quality for readable PDFs
          0,
          RNFS.CachesDirectoryPath,
          false,
          {mode: 'contain', onlyScaleDown: true},
        );
        if (resized?.uri) {
          jpegPath = stripScheme(resized.uri);
          tempPaths.push(jpegPath);
        }
      } catch (e: any) {
        console.warn(`ImageResizer failed for ${f.name}, using original:`, e?.message);
        // fall through — use original URI as-is
      }

      if (!(await RNFS.exists(jpegPath))) {
        throw new Error(`Image file not found on disk: ${f.name}`);
      }

      const b64 = await RNFS.readFile(jpegPath, 'base64');
      if (!b64?.length) throw new Error(`Could not read image: ${f.name}`);

      const bytes = b64ToBytes(b64);
      const {w, h} = parseJpegDimensions(bytes);

      jpegs.push({bytes, w, h});

      onProgress?.(5 + Math.round(((i + 1) / files.length) * 70));
    }

    onProgress?.(80);

    // Step 2 — Build PDF bytes
    const pdfBytes = buildPDF(jpegs);

    onProgress?.(90);

    // Step 3 — Write to cache as base64
    const fileName = `ImageConverter_${Date.now()}.pdf`;
    const outPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    const pdfB64 = bytesToB64(pdfBytes);
    await RNFS.writeFile(outPath, pdfB64, 'base64');

    // Clean up temp JPEGs
    for (const p of tempPaths) {
      try { await RNFS.unlink(p); } catch {}
    }

    if (!(await RNFS.exists(outPath))) {
      throw new Error('PDF was not written to disk');
    }

    const stat = await RNFS.stat(outPath);
    onProgress?.(100);

    return {
      success: true,
      outputUri: addScheme(outPath),
      outputName: `images_to_pdf_${files.length}pages_${Date.now()}.pdf`,
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
// Convert a single image format
// ─────────────────────────────────────────────
export async function convertImage(
  file: ImageFile,
  targetFormat: ImageFormat,
  quality: number,
): Promise<ConvertResult> {
  try {
    if (!file?.uri) throw new Error('Invalid file — no URI');

    const rnFormat: 'JPEG' | 'PNG' | 'WEBP' =
      targetFormat === 'PNG' ? 'PNG' : targetFormat === 'WEBP' ? 'WEBP' : 'JPEG';

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
    } catch (e: any) {
      throw new Error(`ImageResizer failed: ${e?.message ?? e}`);
    }

    if (!resized?.uri) throw new Error('ImageResizer returned no output URI');

    const ext = targetFormat === 'JPEG' ? 'jpg' : targetFormat.toLowerCase();
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const outputName = `${baseName}.${ext}`;
    const destPath = `${RNFS.CachesDirectoryPath}/${Date.now()}_${outputName}`;

    const resizedPath = stripScheme(resized.uri);
    if (!(await RNFS.exists(resizedPath))) {
      throw new Error('ImageResizer output missing on disk');
    }

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
// Save to Downloads / Documents
// ─────────────────────────────────────────────
export async function saveToDownloads(uri: string, name: string): Promise<string> {
  if (!uri) throw new Error('No URI provided');

  const canWrite = await requestWritePermission();
  if (!canWrite) throw new Error('Storage write permission denied');

  const srcPath = stripScheme(uri);
  if (!(await RNFS.exists(srcPath))) throw new Error(`Source file not found: ${srcPath}`);

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

// ─────────────────────────────────────────────
// Share via native share sheet
// ─────────────────────────────────────────────
export async function shareFile(uri: string, name: string, mimeType: string): Promise<void> {
  if (!uri) throw new Error('No URI provided');
  const srcPath = stripScheme(uri);
  if (!(await RNFS.exists(srcPath))) throw new Error(`File not found: ${srcPath}`);

  await Share.open({
    url: addScheme(srcPath),
    title: name,
    type: mimeType,
    failOnCancel: false,
    showAppsToView: true,
  });
}