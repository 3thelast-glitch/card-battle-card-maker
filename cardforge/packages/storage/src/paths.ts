export function joinPath(base: string, file: string) {
  if (!base) return file;
  const sep = base.includes('\\') ? '\\' : '/';
  const normalizedBase = base.endsWith(sep) ? base.slice(0, -1) : base;
  return `${normalizedBase}${sep}${file}`;
}
