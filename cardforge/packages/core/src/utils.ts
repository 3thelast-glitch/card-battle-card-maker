import { nanoid } from 'nanoid';

export function createId(prefix = '') {
  return prefix ? `${prefix}_${nanoid(8)}` : nanoid(10);
}

export function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
