import { describe, it, expect } from 'vitest';
import { sanitizeFileName } from '../filenames';

describe('sanitizeFileName', () => {
  it('removes invalid characters', () => {
    expect(sanitizeFileName('My:Card*Name?')).toBe('My_Card_Name');
  });

  it('trims and collapses spaces', () => {
    expect(sanitizeFileName('  My   Card  ')).toBe('My Card');
  });

  it('falls back for empty input', () => {
    expect(sanitizeFileName('   ')).toBe('untitled');
  });
});
