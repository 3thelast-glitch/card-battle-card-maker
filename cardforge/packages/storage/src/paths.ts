export function joinPath(base: string, file: string) {
  if (!base) return file;
  const sep = base.includes('\\') ? '\\' : '/';
  const normalizedBase = base.endsWith(sep) ? base.slice(0, -1) : base;
  return `${normalizedBase}${sep}${file}`;
}

export function getParentPath(filePath: string) {
  if (!filePath) return '';
  const hasBackslash = filePath.includes('\\');
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  if (idx <= 0) return '';
  const parent = normalized.slice(0, idx);
  return hasBackslash ? parent.replace(/\//g, '\\') : parent;
}
