import type { ElementModel } from './model';

/**
 * Apply data bindings to elements.
 * - Text: bindingKey overrides, otherwise {{field}} placeholders.
 * - Image: bindingKey replaces src when provided.
 */
export function applyBindingsToElements(
  elements: ElementModel[],
  row: Record<string, any>,
): ElementModel[] {
  return elements.map((el) => {
    if (el.type === 'text') {
      const bindingKey = el.bindingKey?.trim();
      if (bindingKey) {
        const v = resolvePath(row, bindingKey);
        const resolved = resolveLocalizedValue(v, row);
        return { ...el, text: resolved == null ? '' : String(resolved) };
      }
      const text = el.text ?? '';
      const next = replacePlaceholders(text, row);
      return { ...el, text: next };
    }

    if (el.type === 'image') {
      const bindingKey = el.bindingKey?.trim();
      if (bindingKey) {
        const v = resolvePath(row, bindingKey);
        const resolved = resolveImageBindingValue(v);
        return { ...el, src: resolved == null ? '' : String(resolved) };
      }
      return el;
    }

    return el;
  });
}

function resolveImageBindingValue(value: any) {
  if (!value) return value;
  if (typeof value === 'object' && value.kind && value.src) {
    if (value.kind === 'video') {
      return value.poster ?? '';
    }
    return value.src;
  }
  return value;
}

export function replacePlaceholders(text: string, row: Record<string, any>) {
  return text.replace(/\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}/g, (_m, key) => {
    const v = resolvePath(row, key);
    const resolved = resolveLocalizedValue(v, row);
    return resolved == null ? '' : String(resolved);
  });
}

function resolveLocalizedValue(value: any, row: Record<string, any>) {
  if (!value || typeof value !== 'object') return value;
  const hasEn = Object.prototype.hasOwnProperty.call(value, 'en');
  const hasAr = Object.prototype.hasOwnProperty.call(value, 'ar');
  if (!hasEn && !hasAr) return value;
  const lang = typeof row.__lang === 'string' ? row.__lang : 'en';
  return value[lang] ?? value.en ?? value.ar ?? '';
}

export function resolvePath(obj: any, path: string) {
  const parts = String(path).split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}
