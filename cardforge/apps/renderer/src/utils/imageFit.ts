export type ImageFitMode = 'cover' | 'contain' | 'fill';

export function normalizeImageFit(fit?: string): ImageFitMode {
  if (fit === 'contain' || fit === 'cover' || fit === 'fill') return fit;
  if (fit === 'stretch') return 'fill';
  return 'cover';
}

export function getImageLayout(
  image: HTMLImageElement | null,
  containerW: number,
  containerH: number,
  fit?: string,
) {
  const mode = normalizeImageFit(fit);
  const safeW = Math.max(0, containerW);
  const safeH = Math.max(0, containerH);
  if (!image || !image.width || !image.height || safeW === 0 || safeH === 0) {
    return { x: 0, y: 0, width: safeW, height: safeH, fit: mode };
  }

  if (mode === 'fill') {
    return { x: 0, y: 0, width: safeW, height: safeH, fit: mode };
  }

  const scale =
    mode === 'contain'
      ? Math.min(safeW / image.width, safeH / image.height)
      : Math.max(safeW / image.width, safeH / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = (safeW - width) / 2;
  const y = (safeH - height) / 2;
  return { x, y, width, height, fit: mode };
}
