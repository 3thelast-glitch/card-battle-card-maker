import type { ImageBindingConfig } from '@cardsmith/core';
import { sanitizeFileName } from '@cardsmith/core';
import { joinPath } from '@cardsmith/storage';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

export type ImageResolutionResult = {
  resolved?: string;
  expected?: string;
  missing: boolean;
  sourcePath?: string;
};

export function getImageBindingDefaults(
  binding?: ImageBindingConfig,
): Required<ImageBindingConfig> {
  return {
    column: binding?.column ?? 'art',
    imagesFolder: binding?.imagesFolder ?? '',
    placeholder: binding?.placeholder ?? '',
    copyToAssets: binding?.copyToAssets ?? true,
  };
}

export function resolveImageReferenceSync(
  rawValue: any,
  binding?: ImageBindingConfig,
) {
  const config = getImageBindingDefaults(binding);
  const artValue = resolveCardArtSource(rawValue);
  const raw = normalizeValue(artValue ?? rawValue);
  if (!raw) {
    return config.placeholder || '';
  }
  if (
    isRemoteOrData(raw) ||
    isFileUrl(raw) ||
    isAbsolutePath(raw) ||
    isAssetsPath(raw)
  ) {
    return raw;
  }
  if (!config.imagesFolder) {
    return raw;
  }
  const candidates = buildCandidates(raw);
  return joinPath(config.imagesFolder, candidates[0]);
}

export async function resolveImageReference(
  rawValue: any,
  binding?: ImageBindingConfig,
  projectRoot?: string,
): Promise<ImageResolutionResult> {
  const config = getImageBindingDefaults(binding);
  const artValue = resolveCardArtSource(rawValue);
  const raw = normalizeValue(artValue ?? rawValue);
  if (!raw) {
    return {
      missing: true,
      expected: config.column || 'image',
    };
  }

  if (isRemoteOrData(raw)) {
    return { resolved: raw, missing: false };
  }

  if (isFileUrl(raw)) {
    const localPath = fileUrlToPath(raw);
    const exists = await fileExists(localPath);
    return exists
      ? { resolved: raw, missing: false, sourcePath: localPath }
      : { missing: true, expected: raw, sourcePath: localPath };
  }

  if (isAbsolutePath(raw)) {
    const exists = await fileExists(raw);
    return exists
      ? { resolved: raw, missing: false, sourcePath: raw }
      : { missing: true, expected: raw, sourcePath: raw };
  }

  if (isAssetsPath(raw)) {
    if (projectRoot) {
      const fullPath = joinPath(projectRoot, raw.replace(/^\/+/, ''));
      const exists = await fileExists(fullPath);
      return exists
        ? { resolved: raw, missing: false, sourcePath: fullPath }
        : { missing: true, expected: raw, sourcePath: fullPath };
    }
    return { resolved: raw, missing: false };
  }

  if (!config.imagesFolder) {
    return { missing: true, expected: raw };
  }

  const candidates = buildCandidates(raw);
  for (const candidate of candidates) {
    const fullPath = joinPath(config.imagesFolder, candidate);
    const exists = await fileExists(fullPath);
    if (exists) {
      return {
        resolved: fullPath,
        missing: false,
        sourcePath: fullPath,
        expected: fullPath,
      };
    }
  }

  return {
    missing: true,
    expected: joinPath(config.imagesFolder, candidates[0]),
  };
}

export async function copyImageToProjectAssets(
  sourcePath: string,
  projectRoot: string,
  existingNames: Set<string>,
): Promise<{ relativePath?: string; size?: number; error?: string }> {
  if (!window.cardsmith) return { error: 'NO_IPC' };
  const fileName = getFileName(sourcePath);
  const ext = getExtension(fileName);
  if (!ext) return { error: 'NO_EXTENSION' };

  const safeName = getUniqueName(
    `${sanitizeFileName(fileName.slice(0, fileName.length - ext.length))}${ext}`,
    existingNames,
  );
  const relativePath = `assets/images/${safeName}`;
  const destinationPath = joinPath(projectRoot, relativePath);

  const result = await window.cardsmith.copyFile(sourcePath, destinationPath);
  if (result.ok) {
    return { relativePath, size: result.size ?? 0 };
  }
  if (result.error === 'EEXIST') {
    const retryName = getUniqueName(
      `${sanitizeFileName(fileName.slice(0, fileName.length - ext.length))}${ext}`,
      existingNames,
    );
    const retryRelative = `assets/images/${retryName}`;
    const retryPath = joinPath(projectRoot, retryRelative);
    const retry = await window.cardsmith.copyFile(sourcePath, retryPath);
    if (retry.ok) return { relativePath: retryRelative, size: retry.size ?? 0 };
  }
  return { error: result.error ?? 'COPY_FAILED' };
}

export function fileUrlToPath(value: string) {
  if (!isFileUrl(value)) return value;
  let without = value.replace(/^file:\/\//, '');
  if (without.startsWith('/')) {
    without = without.replace(/^\/+/, '');
    if (/^[a-zA-Z]:/.test(without)) {
      return without;
    }
    return `//${without}`;
  }
  if (/^[a-zA-Z]:/.test(without)) return without;
  return `//${without}`;
}

export function isAbsolutePath(value: string) {
  return (
    /^[a-zA-Z]:[\\/]/.test(value) ||
    value.startsWith('\\\\') ||
    value.startsWith('/')
  );
}

export function isFileUrl(value: string) {
  return value.startsWith('file://');
}

export function isAssetsPath(value: string) {
  return (
    value.startsWith('assets/') ||
    value.startsWith('assets\\') ||
    value.startsWith('/assets/')
  );
}

export function isRemoteOrData(value: string) {
  return (
    value.startsWith('data:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  );
}

export function normalizeValue(value: any) {
  if (value == null) return '';
  return String(value).trim();
}

function resolveCardArtSource(value: any): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (value.kind === 'image' && typeof value.src === 'string') {
    return value.src;
  }
  if (value.kind === 'video' && typeof value.src === 'string') {
    if (typeof value.poster === 'string' && value.poster.length > 0) {
      return value.poster;
    }
    return '';
  }
  return undefined;
}

export function buildCandidates(raw: string) {
  const cleaned = raw.trim();
  if (!cleaned) return [''];
  if (hasExtension(cleaned)) return [cleaned];
  return IMAGE_EXTENSIONS.map((ext) => `${cleaned}${ext}`);
}

export function hasExtension(value: string) {
  return /\.[a-zA-Z0-9]+$/.test(value);
}

async function fileExists(filePath: string) {
  if (!window.cardsmith || !window.cardsmith.fileExists) return true;
  const res = await window.cardsmith.fileExists(filePath);
  return Boolean(res.exists);
}

function getFileName(filePath: string) {
  if (!filePath) return '';
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}

function getExtension(fileName: string) {
  const idx = fileName.lastIndexOf('.');
  if (idx <= 0) return '';
  return fileName.slice(idx).toLowerCase();
}

function getUniqueName(baseName: string, existing: Set<string>) {
  let name = baseName;
  let counter = 1;
  const ext = getExtension(baseName);
  const root = ext ? baseName.slice(0, -ext.length) : baseName;
  while (existing.has(name.toLowerCase())) {
    name = `${root}_${counter}${ext}`;
    counter += 1;
  }
  existing.add(name.toLowerCase());
  return name;
}
