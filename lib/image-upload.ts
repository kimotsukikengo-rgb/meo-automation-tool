"use client";

/**
 * 投稿に使う画像をPCから取り込むためのクライアント側ユーティリティ。
 *
 * - 元画像をそのまま保持すると localStorage 容量・APIペイロードが膨らむため、
 *   canvas で長辺を縮小し JPEG の data URL に変換して軽量化する。
 * - 変換後の data URL は usePersistentState で保存し、画面遷移しても消えないようにする。
 */

/** 縮小後の長辺の最大px（プレビュー・AI解析に十分な解像度） */
const DEFAULT_MAX_DIM = 1440;
/** JPEG変換時の品質 */
const DEFAULT_QUALITY = 0.82;

export interface UploadedImage {
  /** 縮小後の JPEG data URL */
  dataUrl: string;
  /** 元ファイル名（プレビュー表示用） */
  name: string;
}

/** File が画像かどうか（type が image/* で始まるか）を判定する */
export function isAcceptedImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/** 画像ファイルを縮小して JPEG の data URL に変換する */
export async function fileToDownscaledImage(
  file: File,
  maxDim = DEFAULT_MAX_DIM,
  quality = DEFAULT_QUALITY,
): Promise<UploadedImage> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = fitWithin(
      img.naturalWidth,
      img.naturalHeight,
      maxDim,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("画像の変換に失敗しました");
    ctx.drawImage(img, 0, 0, width, height);

    return { dataUrl: canvas.toDataURL("image/jpeg", quality), name: file.name };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像を読み込めませんでした"));
    img.src = src;
  });
}

/** 縦横比を保ったまま長辺を maxDim 以内に収めた寸法を返す */
function fitWithin(
  w: number,
  h: number,
  maxDim: number,
): { width: number; height: number } {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h };
  const scale = maxDim / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}
