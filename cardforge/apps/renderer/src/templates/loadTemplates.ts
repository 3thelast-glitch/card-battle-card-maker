import type { Blueprint } from '@cardsmith/core';
import fantasy from '@templates/fantasy-basic.json';
import blank from '@templates/blank.json';

export function loadBuiltInTemplates(): Blueprint[] {
  return [fantasy as Blueprint, blank as Blueprint];
}
