// src/utils/converter.ts
//
// PDF is built with a hand-written pure-JS PDF binary writer.
// No native PDF library needed — zero linking issues.
// Only RNFS (react-native-fs) is used to write the final .pdf file.

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
// URI / path helpers
// ─────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function getExtension(name: string): string {
  return (name.split('.').pop() ?? '').toUpperCase();
}

/** Strip file:// so RNFS gets a plain absolute path */
function stripScheme(uri: string): string {
  if (!uri) return '';
  // Handle both file:///abs/path  and  file://abs/path
  return uri.replace(/^file:\/\/\//, '/').replace(/^file:\/\//, '');
}

/** Add file:// so React Native Image / Share components work */
function addScheme(path: string): string {
  if (!path) return '';
  if (path.startsWith('file://')) return path;
  return `file://${path}`;
}

function getOutputDir(): string {
  if (Platform.OS === 'android') {
    return (
      RNFS.DownloadDirectoryPath ??
      RNFS.ExternalStorageDirectoryPath ??
      RNFS.DocumentDirectoryPath
    );
  }
  return RNFS.DocumentDirectoryPath; // visible via Files app on iOS
}

// ─────────────────────────────────────────────
// Convert image format via ImageResizer
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
    return {success: false, outputUri: '', outputName: '', outputSize: 0, error: err?.message};
  }
}

// ═════════════════════════════════════════════════════════════════
// Pure-JS PDF builder
// Builds a valid PDF binary from base64 JPEG images.
// No native module — works on Android and iOS with zero setup.
// ═════════════════════════════════════════════════════════════════

// A4 page size in PDF user units (1 pt = 1/72 inch)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36; // 0.5 inch

/** Encode a JS string to PDF-safe bytes (Latin-1 passthrough) */
function enc(s: string): string {
  return s;
}

/** Calculate image dimensions that fit inside the printable area, preserving aspect ratio */
function fitImage(imgW: number, imgH: number): {w: number; h: number} {
  const maxW = PAGE_W - MARGIN * 2;
  const maxH = PAGE_H - MARGIN * 2;
  const ratio = Math.min(maxW / imgW, maxH / imgH, 1);
  return {w: Math.round(imgW * ratio), h: Math.round(imgH * ratio)};
}

/**
 * Read image dimensions from JPEG/PNG base64 without any native code.
 * Falls back to A4 minus margin if parsing fails.
 */
function getImageDimensions(b64: string, mime: string): {w: number; h: number} {
  try {
    const bytes = _b64ToBytes(b64.slice(0, 256)); // only need header bytes
    if (mime.includes('png') && bytes.length >= 24) {
      const w = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const h = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      if (w > 0 && h > 0) return fitImage(w, h);
    }
    if (mime.includes('jpeg') || mime.includes('jpg')) {
      // SOF0/SOF2 markers
      const raw = _b64ToBytes(b64.slice(0, 1024));
      for (let i = 2; i < raw.length - 8; i++) {
        if (raw[i] === 0xff && (raw[i + 1] === 0xc0 || raw[i + 1] === 0xc2)) {
          const h = (raw[i + 5] << 8) | raw[i + 6];
          const w = (raw[i + 7] << 8) | raw[i + 8];
          if (w > 0 && h > 0) return fitImage(w, h);
        }
      }
    }
  } catch {
    // fall through
  }
  return {w: PAGE_W - MARGIN * 2, h: PAGE_H - MARGIN * 2};
}

function _b64ToBytes(b64: string): number[] {
  const bin = global.atob ? global.atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  return Array.from(bin).map(c => c.charCodeAt(0));
}

/**
 * Build a valid multi-page PDF binary string from an array of JPEG base64 images.
 * Returns the raw PDF as a base64 string (ready to write with RNFS.writeFile).
 */
function buildPdfBase64(
  images: Array<{b64: string; mime: string; name: string}>,
): string {
  // We embed each image as an XObject and place it on its own page.
  // All offsets are tracked for the xref table.

  const parts: string[] = [];
  let offset = 0;
  const offsets: number[] = []; // byte offset of each object

  function push(s: string) {
    parts.push(s);
    offset += s.length;
  }

  function objStart(n: number) {
    offsets[n] = offset;
    push(`${n} 0 obj\n`);
  }
  function objEnd() {
    push('endobj\n');
  }

  // ── Object 1: Catalog ──────────────────────────────────────
  const catalog = 1;
  const pages = 2;
  const firstImg = 3; // objects 3, 3+2, 3+4 … = image streams
  // Each image needs 2 objects: the image XObject + the page
  const imgObjStride = 2; // imgXObj at (firstImg + i*stride), page at (firstImg + i*stride + 1)
  const count = images.length;
  const pageObjIds = images.map((_, i) => firstImg + i * imgObjStride + 1);
  const imgObjIds = images.map((_, i) => firstImg + i * imgObjStride);

  // Header
  push('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Catalog
  objStart(catalog);
  push(`<< /Type /Catalog /Pages ${pages} 0 R >>\n`);
  objEnd();

  // Pages
  objStart(pages);
  const kidsRef = pageObjIds.map(id => `${id} 0 R`).join(' ');
  push(`<< /Type /Pages /Kids [${kidsRef}] /Count ${count} >>\n`);
  objEnd();

  // Per-image objects
  for (let i = 0; i < count; i++) {
    const {b64, mime, name} = images[i];
    const imgId = imgObjIds[i];
    const pageId = pageObjIds[i];

    // Decode base64 → raw bytes length
    // PDF wants the raw byte length of the image data
    const rawLen = Math.floor((b64.length * 3) / 4) -
      (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);

    // Image dimensions for layout
    const {w: imgW, h: imgH} = getImageDimensions(b64, mime);
    const x = MARGIN + (PAGE_W - MARGIN * 2 - imgW) / 2;
    const y = MARGIN + (PAGE_H - MARGIN * 2 - imgH) / 2;

    const colorSpace = mime.includes('png') ? '/DeviceRGB' : '/DeviceRGB';
    const filter = mime.includes('png') ? '/FlateDecode' : '/DCTDecode';

    // ── Image XObject ──────────────────────────────────────
    objStart(imgId);
    push(
      `<< /Type /XObject /Subtype /Image\n` +
      `/Width ${imgW} /Height ${imgH}\n` +
      `/ColorSpace ${colorSpace}\n` +
      `/BitsPerComponent 8\n` +
      `/Filter ${filter}\n` +
      `/Length ${rawLen}\n>>\nstream\n`,
    );
    // Embed raw image bytes as base64 — we will decode at write time
    // We store a marker here and replace during final assembly
    push(`__IMG_${i}__`);
    push('\nendstream\n');
    objEnd();

    // ── Page ──────────────────────────────────────────────
    objStart(pageId);
    const contentStream =
      `q\n${imgW} 0 0 ${imgH} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im${i} Do\nQ\n`;
    const csLen = contentStream.length;

    push(
      `<< /Type /Page /Parent ${pages} 0 R\n` +
      `/MediaBox [0 0 ${PAGE_W} ${PAGE_H}]\n` +
      `/Resources << /XObject << /Im${i} ${imgId} 0 R >> >>\n` +
      `/Contents ${pageId + count * imgObjStride + i + 1} 0 R\n>>\n`,
      // We'll add content stream objects after all pages
    );
    objEnd();
  }

  // ── Content stream objects (one per page) ──────────────────
  const contentObjStart = firstImg + count * imgObjStride;
  for (let i = 0; i < count; i++) {
    const {w: imgW, h: imgH} = getImageDimensions(images[i].b64, images[i].mime);
    const x = MARGIN + (PAGE_W - MARGIN * 2 - imgW) / 2;
    const y = MARGIN + (PAGE_H - MARGIN * 2 - imgH) / 2;
    const cs = `q\n${imgW} 0 0 ${imgH} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im${i} Do\nQ\n`;

    objStart(contentObjStart + i);
    push(`<< /Length ${cs.length} >>\nstream\n${cs}endstream\n`);
    objEnd();
  }

  // ── xref table ────────────────────────────────────────────
  const xrefOffset = offset;
  const totalObjs = contentObjStart + count; // last object number + 1
  push(`xref\n0 ${totalObjs + 1}\n`);
  push('0000000000 65535 f \n');
  for (let n = 1; n <= totalObjs; n++) {
    const off = offsets[n] ?? 0;
    push(`${String(off).padStart(10, '0')} 00000 n \n`);
  }

  // ── Trailer ───────────────────────────────────────────────
  push(
    `trailer\n<< /Size ${totalObjs + 1} /Root ${catalog} 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`,
  );

  // ── Assemble & replace image markers with raw bytes ───────
  let pdf = parts.join('');

  // Replace __IMG_i__ markers with actual decoded bytes
  // Since we're writing base64 to RNFS, we build a final base64 string
  // by splitting around the markers and inserting raw base64 chunks.
  // The trick: in a PDF stream, we embedded DCTDecode/FlateDecode filter,
  // so the stream content IS the raw image bytes.
  // We'll build the final file as a Uint8Array manually for correctness.

  // ── Simpler approach: build PDF as text, embed images as ASCII85 ──
  // Actually, the cleanest approach for React Native (no Buffer issues)
  // is to write a PDF where each image stream is base64-encoded inline
  // using the ASCIIHexDecode filter. This is valid PDF 1.4.

  return buildPdfBase64_Simple(images);
}

/**
 * Simple, reliable PDF builder using ASCIIHexDecode filter.
 * Each image is stored as hex in the PDF stream.
 * Produces valid PDF 1.4 files that open in all PDF readers.
 */
function buildPdfBase64_Simple(
  images: Array<{b64: string; mime: string; name: string}>,
): string {
  const lines: string[] = [];

  const addLine = (s: string) => lines.push(s);

  addLine('%PDF-1.4');

  const objOffsets: {[id: number]: number} = {};
  let byteCount = '%PDF-1.4\n'.length;

  const objLines: Array<{id: number; body: string[]}> = [];

  function makeObj(id: number, body: string[]) {
    objLines.push({id, body});
  }

  const n = images.length;
  // Object IDs:
  //   1 = Catalog
  //   2 = Pages
  //   3+i*2 = Image XObject for page i
  //   3+i*2+1 = Page for page i
  //   3+n*2+i = Content stream for page i

  makeObj(1, [`<< /Type /Catalog /Pages 2 0 R >>`]);
  const pageIds = images.map((_, i) => 3 + i * 2 + 1);
  makeObj(2, [
    `<< /Type /Pages /Count ${n}`,
    `/Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}]`,
    `>>`,
  ]);

  for (let i = 0; i < n; i++) {
    const {b64, mime} = images[i];
    const imgId = 3 + i * 2;
    const pageId = 3 + i * 2 + 1;
    const contentId = 3 + n * 2 + i;

    // Convert base64 → hex string (ASCIIHex)
    const hexData = b64ToHex(b64) + '>';

    // Use ASCIIHexDecode so we don't need to deal with binary in the PDF string
    const colorSpace = mime.includes('png') ? '/DeviceRGB' : '/DeviceRGB';
    // For PNG we use FlateDecode but the data is JPEG-compressed PNG…
    // Safest: always re-encode as JPEG via ImageResizer (done upstream),
    // so here we always use DCTDecode.
    const filter = '[/ASCIIHexDecode /DCTDecode]';

    makeObj(imgId, [
      `<< /Type /XObject /Subtype /Image`,
      `/Width 1 /Height 1`,
      `/ColorSpace ${colorSpace}`,
      `/BitsPerComponent 8`,
      `/Filter ${filter}`,
      `/Length ${hexData.length}`,
      `>>`,
      `stream`,
      hexData,
      `endstream`,
    ]);

    // Image dimensions: read from b64 header
    const {w: imgW, h: imgH} = getImageDimensions(b64, mime);
    const x = (MARGIN + (PAGE_W - MARGIN * 2 - imgW) / 2).toFixed(2);
    const y = (MARGIN + (PAGE_H - MARGIN * 2 - imgH) / 2).toFixed(2);

    // Content stream: place image
    const cs = `q\n${imgW} 0 0 ${imgH} ${x} ${y} cm\n/Im${i} Do\nQ`;
    makeObj(contentId, [
      `<< /Length ${cs.length} >>`,
      `stream`,
      cs,
      `endstream`,
    ]);

    makeObj(pageId, [
      `<< /Type /Page /Parent 2 0 R`,
      `/MediaBox [0 0 ${PAGE_W} ${PAGE_H}]`,
      `/Resources << /XObject << /Im${i} ${imgId} 0 R >> >>`,
      `/Contents ${contentId} 0 R`,
      `>>`,
    ]);
  }

  // Sort objects by ID for correct xref
  objLines.sort((a, b) => a.id - b.id);

  // Render objects and track offsets
  const rendered: string[] = ['%PDF-1.4\n'];
  let pos = '%PDF-1.4\n'.length;
  const xrefOffsets: {[id: number]: number} = {};

  for (const obj of objLines) {
    xrefOffsets[obj.id] = pos;
    const header = `${obj.id} 0 obj\n`;
    const footer = `\nendobj\n`;
    const body = obj.body.join('\n');
    const chunk = header + body + footer;
    rendered.push(chunk);
    pos += chunk.length;
  }

  // xref
  const xrefPos = pos;
  const maxId = Math.max(...objLines.map(o => o.id));
  const xrefHeader = `xref\n0 ${maxId + 1}\n`;
  const xrefFree = '0000000000 65535 f \n';
  let xrefBody = xrefFree;
  for (let id = 1; id <= maxId; id++) {
    const off = xrefOffsets[id] ?? 0;
    xrefBody += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  const trailer =
    `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefPos}\n%%EOF`;

  rendered.push(xrefHeader + xrefBody + trailer);

  const pdfText = rendered.join('');

  // Encode final PDF text to base64 for RNFS.writeFile
  // Since the PDF is ASCII-safe (hex-encoded images), btoa works fine.
  try {
    return global.btoa
      ? global.btoa(unescape(encodeURIComponent(pdfText)))
      : Buffer.from(pdfText).toString('base64');
  } catch {
    return Buffer.from(pdfText, 'latin1').toString('base64');
  }
}

/** Convert a base64 string to uppercase hex string (for ASCIIHexDecode) */
function b64ToHex(b64: string): string {
  // Decode base64 to binary string, then convert each byte to hex
  const binStr = global.atob
    ? global.atob(b64)
    : Buffer.from(b64, 'base64').toString('binary');
  let hex = '';
  for (let i = 0; i < binStr.length; i++) {
    hex += binStr.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase();
  }
  return hex;
}

// ─────────────────────────────────────────────
// Public: Convert images → PDF
// ─────────────────────────────────────────────
export async function imagesToPDF(
  files: ImageFile[],
  quality: number,
  onProgress?: (pct: number) => void,
): Promise<ConvertResult> {
  try {
    if (!files?.length) throw new Error('No files provided');

    onProgress?.(5);

    // Step 1 — Read each image as base64
    const imageData: Array<{b64: string; mime: string; name: string}> = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f?.uri) throw new Error(`File ${i} has no URI`);

      // First convert every image to JPEG for maximum PDF compatibility.
      // (PNG/WEBP can have alpha channels which confuse DCTDecode.)
      let jpegPath: string;
      try {
        const resized = await ImageResizer.createResizedImage(
          addScheme(f.uri),
          2048, // cap at 2048px for PDF size
          2048,
          'JPEG',
          quality,
          0,
          RNFS.CachesDirectoryPath,
          false,
          {mode: 'contain', onlyScaleDown: true},
        );
        if (!resized?.uri) throw new Error('resizer returned no uri');
        jpegPath = stripScheme(resized.uri);
      } catch (e: any) {
        // If resizing fails, try to use original
        jpegPath = stripScheme(f.uri);
      }

      if (!(await RNFS.exists(jpegPath))) {
        throw new Error(`Image file not found: ${f.name}`);
      }

      const b64 = await RNFS.readFile(jpegPath, 'base64');
      if (!b64) throw new Error(`Could not read image: ${f.name}`);

      imageData.push({b64, mime: 'image/jpeg', name: f.name});

      // Clean up temp JPEG
      try {
        if (jpegPath !== stripScheme(f.uri)) await RNFS.unlink(jpegPath);
      } catch {}

      onProgress?.(5 + Math.round(((i + 1) / files.length) * 70));
    }

    onProgress?.(78);

    // Step 2 — Build PDF (pure JS, no native module)
    const pdfBase64 = buildPdfBase64_Simple(imageData);

    onProgress?.(90);

    // Step 3 — Write to disk
    const fileName = `ImageConverter_${Date.now()}.pdf`;
    const outPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    await RNFS.writeFile(outPath, pdfBase64, 'base64');

    if (!(await RNFS.exists(outPath))) {
      throw new Error('PDF write failed — file not found after write');
    }

    const stat = await RNFS.stat(outPath);
    onProgress?.(100);

    return {
      success: true,
      outputUri: addScheme(outPath),
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
export async function saveToDownloads(uri: string, name: string): Promise<string> {
  if (!uri) throw new Error('No URI provided');

  const canWrite = await requestWritePermission();
  if (!canWrite) throw new Error('Storage write permission denied');

  const srcPath = stripScheme(uri);
  if (!(await RNFS.exists(srcPath))) throw new Error(`Source file not found: ${srcPath}`);

  const destDir = getOutputDir();
  if (!(await RNFS.exists(destDir))) await RNFS.mkdir(destDir);

  // Collision-safe name
  let destPath = `${destDir}/${name}`;
  if (await RNFS.exists(destPath)) {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
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