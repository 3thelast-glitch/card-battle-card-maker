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
        return { ...el, text: v == null ? '' : String(v) };
      }
      const text = el.text ?? '';
      const next = replacePlaceholders(text, row);
      return { ...el, text: next };
    }

    if (el.type === 'image') {
      const bindingKey = el.bindingKey?.trim();
      if (bindingKey) {
        const v = resolvePath(row, bindingKey);
        return { ...el, src: v == null ? '' : String(v) };
      }
      return el;
    }

    return el;
  });
}

export function replacePlaceholders(text: string, row: Record<string, any>) {
  return text.replace(/\{\{\s*([a-zA-Z0-9_\.\-]+)\s*\}\}/g, (_m, key) => {
    const v = resolvePath(row, key);
    return v == null ? '' : String(v);
  });
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
