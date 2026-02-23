import { joinPath } from '@cardsmith/storage';

export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1] ?? '';
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

export function toFileUrl(filePath: string) {
  if (!filePath) return '';
  if (filePath.startsWith('file://')) return filePath;
  const normalized = filePath.replace(/\\/g, '/');
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }
  if (normalized.startsWith('//')) {
    return `file:${normalized}`;
  }
  return `file://${normalized}`;
}

export function resolveImageSrc(value?: string, projectRoot?: string) {
  if (!value) return '';
  if (value.startsWith('/assets/')) return value;
  if (
    value.startsWith('data:') ||
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://')
  ) {
    return value;
  }
  if (
    /^[a-zA-Z]:\\/.test(value) ||
    value.startsWith('\\\\') ||
    value.startsWith('/')
  ) {
    return toFileUrl(value);
  }
  if (projectRoot) {
    return toFileUrl(joinPath(projectRoot, value));
  }
  return value;
}
