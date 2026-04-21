// src/utils/converter.ts
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

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
// Format a byte count into a human-readable string
// ─────────────────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─────────────────────────────────────────────
// Get file extension from URI or name
// ─────────────────────────────────────────────
export function getExtension(name: string): string {
  return (name.split('.').pop() ?? '').toUpperCase();
}

// ─────────────────────────────────────────────
// Convert image to a different format using react-native-image-resizer
// Quality: 0–100
// ─────────────────────────────────────────────
export async function convertImage(
  file: ImageFile,
  targetFormat: ImageFormat,
  quality: number,
): Promise<ConvertResult> {
  try {
    const rnFormat =
      targetFormat === 'PNG' ? 'PNG' : targetFormat === 'WEBP' ? 'WEBP' : 'JPEG';

    // Resizer re-encodes the image in the target format
    const result = await ImageResizer.createResizedImage(
      file.uri,
      4096,      // max width  (keeps original if smaller)
      4096,      // max height (keeps original if smaller)
      rnFormat,
      quality,
      0,         // rotation
      RNFS.CachesDirectoryPath,
      false,
      {mode: 'contain', onlyScaleDown: true},
    );

    const ext = targetFormat === 'JPEG' ? 'jpg' : targetFormat.toLowerCase();
    const outputName = file.name.replace(/\.[^.]+$/, `.${ext}`);
    const destPath = `${RNFS.CachesDirectoryPath}/${Date.now()}_${outputName}`;

    // Move from temp location to our cache path with proper name
    await RNFS.moveFile(result.uri.replace('file://', ''), destPath);

    const stat = await RNFS.stat(destPath);

    return {
      success: true,
      outputUri: `file://${destPath}`,
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
// Convert multiple images into a single PDF
// Uses react-native-htmltopdf which renders HTML → PDF natively
// ─────────────────────────────────────────────
export async function imagesToPDF(
  files: ImageFile[],
  quality: number,
  onProgress?: (pct: number) => void,
): Promise<ConvertResult> {
  try {
    // Step 1 – encode each image as base64 so we can embed in HTML
    const base64Images: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i].uri.replace('file://', '');
      const b64 = await RNFS.readFile(filePath, 'base64');
      const mime =
        files[i].type === 'image/png'
          ? 'image/png'
          : files[i].type === 'image/webp'
          ? 'image/webp'
          : 'image/jpeg';
      base64Images.push(`data:${mime};base64,${b64}`);
      onProgress?.(Math.round(((i + 1) / files.length) * 70));
    }

    // Step 2 – build an HTML string with one page per image
    const pageHtml = base64Images
      .map(
        (src, idx) => `
        <div class="page">
          <img src="${src}" />
          <p class="label">Page ${idx + 1} / ${files.length} — ${files[idx].name}</p>
        </div>`,
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #fff; font-family: Helvetica, sans-serif; }
            .page {
              width: 100%;
              page-break-after: always;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              min-height: 100vh;
            }
            .page:last-child { page-break-after: auto; }
            img {
              max-width: 100%;
              max-height: 90vh;
              object-fit: contain;
              display: block;
            }
            .label {
              margin-top: 12px;
              font-size: 10px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>${pageHtml}</body>
      </html>`;

    onProgress?.(80);

    // Step 3 – render HTML → PDF
    const pdfResult = await RNHTMLtoPDF.convert({
      html,
      fileName: `ImageConverter_${Date.now()}`,
      directory: 'Documents',
      base64: false,
    });

    onProgress?.(95);

    if (!pdfResult.filePath) throw new Error('PDF path missing');

    const stat = await RNFS.stat(pdfResult.filePath);
    onProgress?.(100);

    return {
      success: true,
      outputUri: `file://${pdfResult.filePath}`,
      outputName: `converted_${files.length}_images.pdf`,
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
// Share / download a file via the native share sheet
// ─────────────────────────────────────────────
export async function shareFile(
  uri: string,
  name: string,
  mimeType: string,
): Promise<void> {
  try {
    await Share.open({
      url: uri,
      title: name,
      type: mimeType,
      failOnCancel: false,
    });
  } catch (err) {
    console.error('shareFile error:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────
// Save file to Downloads / Documents folder
// ─────────────────────────────────────────────
export async function saveToDownloads(
  uri: string,
  name: string,
): Promise<string> {
  const src = uri.replace('file://', '');
  const destDir =
    RNFS.DownloadDirectoryPath ?? RNFS.DocumentDirectoryPath;
  const dest = `${destDir}/${name}`;
  await RNFS.copyFile(src, dest);
  return dest;
}