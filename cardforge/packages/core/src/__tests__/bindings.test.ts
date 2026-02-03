import { describe, it, expect } from 'vitest';
import { applyBindingsToElements } from '../bindings';
import type { ElementModel } from '../model';

describe('bindings', () => {
  it('replaces {{field}} placeholders in text', () => {
    const elements: ElementModel[] = [
      {
        id: 't1',
        type: 'text',
        name: 'Title',
        x: 0,
        y: 0,
        w: 100,
        h: 40,
        rotation: 0,
        visible: true,
        zIndex: 1,
        text: 'Hello {{name}}',
      },
    ];
    const result = applyBindingsToElements(elements, { name: 'World' });
    expect(result[0].type).toBe('text');
    expect((result[0] as any).text).toBe('Hello World');
  });

  it('supports dot paths', () => {
    const elements: ElementModel[] = [
      {
        id: 't2',
        type: 'text',
        name: 'Stats',
        x: 0,
        y: 0,
        w: 100,
        h: 40,
        rotation: 0,
        visible: true,
        zIndex: 1,
        text: 'ATK {{stats.attack}}',
      },
    ];
    const result = applyBindingsToElements(elements, { stats: { attack: 7 } });
    expect((result[0] as any).text).toBe('ATK 7');
  });

  it('handles missing fields gracefully', () => {
    const elements: ElementModel[] = [
      {
        id: 't3',
        type: 'text',
        name: 'Desc',
        x: 0,
        y: 0,
        w: 100,
        h: 40,
        rotation: 0,
        visible: true,
        zIndex: 1,
        text: 'Value: {{missing}}',
      },
    ];
    const result = applyBindingsToElements(elements, {});
    expect((result[0] as any).text).toBe('Value: ');
  });
});
