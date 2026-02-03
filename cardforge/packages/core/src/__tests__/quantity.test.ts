import { describe, it, expect } from 'vitest';
import { expandRowsWithQuantity } from '../quantity';
import type { DataRow } from '../model';

describe('expandRowsWithQuantity', () => {
  it('expands rows by quantity', () => {
    const rows: DataRow[] = [
      { id: 'r1', data: { name: 'A' }, quantity: 2 },
      { id: 'r2', data: { name: 'B' }, quantity: 1 },
    ];
    const expanded = expandRowsWithQuantity(rows);
    expect(expanded).toHaveLength(3);
    expect(expanded[0].copyIndex).toBe(1);
    expect(expanded[1].copyIndex).toBe(2);
    expect(expanded[2].id).toBe('r2');
  });

  it('defaults invalid quantities to 1', () => {
    const rows: DataRow[] = [{ id: 'r1', data: {}, quantity: 0 }];
    const expanded = expandRowsWithQuantity(rows);
    expect(expanded).toHaveLength(1);
  });
});
