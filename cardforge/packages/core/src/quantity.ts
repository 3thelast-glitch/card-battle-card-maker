import type { DataRow } from './model';

export type ExpandedRow = DataRow & { copyIndex: number };

export function expandRowsWithQuantity(rows: DataRow[]): ExpandedRow[] {
  const expanded: ExpandedRow[] = [];
  for (const row of rows) {
    const qty = normalizeQuantity(row.quantity);
    for (let i = 1; i <= qty; i += 1) {
      expanded.push({ ...row, copyIndex: i });
    }
  }
  return expanded;
}

export function normalizeQuantity(value: any) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 1;
  return Math.floor(num);
}
