// ==========================================
// Apex Suite: Math Lab - Client image compressor
// ==========================================
// スマホの高解像度写真を API 送信前に縮小し、ボディ制限と Gemini Vision
// のペイロード上限を避ける。ブラウザ専用（HTML5 Canvas）。

export const COMPRESS_MAX_WIDTH = 1200;
export const COMPRESS_JPEG_QUALITY = 0.8;
export const COMPRESS_MAX_DATA_URL_CHARS = 1_800_000;
export const COMPRESS_MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export interface CompressedImagePayload {
  dataUrl: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
}

function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('画像の読み込みに失敗しました'));
        return;
      }
      ctx.drawImage(image, 0, 0);
      createImageBitmap(canvas).then(resolve).catch(reject);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };
    image.src = url;
  });
}

export async function compressImageFile(file: File): Promise<CompressedImagePayload> {
  if (!file.type.startsWith('image/')) {
    throw new Error('画像ファイルを選択してください。');
  }
  if (file.size > COMPRESS_MAX_SOURCE_BYTES) {
    throw new Error('画像は 20MB 以下にしてください。');
  }

  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, COMPRESS_MAX_WIDTH / Math.max(1, bitmap.width));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('画像の圧縮に失敗しました。');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = COMPRESS_JPEG_QUALITY;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > COMPRESS_MAX_DATA_URL_CHARS && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > COMPRESS_MAX_DATA_URL_CHARS) {
    throw new Error('画像を安全なサイズに圧縮できませんでした。別の写真で試してください。');
  }
  return { dataUrl, mimeType: 'image/jpeg', width, height };
}
