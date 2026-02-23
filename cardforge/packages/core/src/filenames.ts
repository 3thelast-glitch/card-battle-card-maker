import { resolvePath } from './bindings';

export function sanitizeFileName(input: string) {
  const cleaned = String(input)
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'untitled';
  return cleaned.slice(0, 120);
}

export function applyNamingTemplate(
  template: string,
  data: Record<string, any>,
) {
  if (!template?.trim()) return 'untitled';
  return template.replace(/\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}/g, (_m, key) => {
    const v = resolvePath(data, key);
    return v == null ? '' : String(v);
  });
}
