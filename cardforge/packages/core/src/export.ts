import type { Blueprint, DataRow } from './model';
import { applyNamingTemplate, sanitizeFileName } from './filenames';
import { expandRowsWithQuantity } from './quantity';

export type ExportOptions = {
  namingTemplate: string;
  pixelRatio: number;
  fallbackName?: string;
};

export type ExportProgress = {
  current: number;
  total: number;
  fileName: string;
  rowId: string;
  copyIndex: number;
};

export type ExportCallbacks = {
  render: (
    row: DataRow,
    copyIndex: number,
    blueprint: Blueprint,
    options: ExportOptions,
  ) => Promise<string | null>;
  writeFile: (
    fileName: string,
    dataUrl: string,
    progress: ExportProgress,
  ) => Promise<void>;
  onProgress?: (progress: ExportProgress) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
};

export class ExportService {
  private cancelled = false;

  cancel() {
    this.cancelled = true;
  }

  async run(
    blueprint: Blueprint,
    rows: DataRow[],
    options: ExportOptions,
    callbacks: ExportCallbacks,
  ) {
    this.cancelled = false;
    const expanded = expandRowsWithQuantity(rows);
    const usedNames = new Map<string, number>();

    try {
      for (let i = 0; i < expanded.length; i += 1) {
        if (this.cancelled) break;

        const row = expanded[i];
        const rawName = applyNamingTemplate(options.namingTemplate, {
          ...row.data,
          id: row.id,
          copy: row.copyIndex,
          setId: row.setId,
        });
        const templateHasCopy = options.namingTemplate.includes('{{copy');
        const baseRaw = rawName || options.fallbackName || `card_${i + 1}`;
        const withCopy =
          !templateHasCopy && (row.quantity ?? 1) > 1
            ? `${baseRaw}_${row.copyIndex}`
            : baseRaw;
        const baseName = sanitizeFileName(withCopy);
        const fileName = ensureUnique(`${baseName}.png`, usedNames);

        const dataUrl = await callbacks.render(
          row,
          row.copyIndex,
          blueprint,
          options,
        );
        if (!dataUrl) continue;

        const progress: ExportProgress = {
          current: i + 1,
          total: expanded.length,
          fileName,
          rowId: row.id,
          copyIndex: row.copyIndex,
        };

        await callbacks.writeFile(fileName, dataUrl, progress);
        callbacks.onProgress?.(progress);
      }

      callbacks.onComplete?.();
    } catch (err) {
      callbacks.onError?.(err as Error);
      throw err;
    }
  }
}

function ensureUnique(fileName: string, usedNames: Map<string, number>) {
  if (!usedNames.has(fileName)) {
    usedNames.set(fileName, 1);
    return fileName;
  }

  const next = (usedNames.get(fileName) ?? 1) + 1;
  usedNames.set(fileName, next);
  const dot = fileName.lastIndexOf('.');
  const base = dot >= 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot >= 0 ? fileName.slice(dot) : '';
  return `${base}_${next}${ext}`;
}
