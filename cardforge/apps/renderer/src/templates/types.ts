import type { Blueprint } from '@cardsmith/core';

export type LocalizedString = Record<string, string>;

export type TemplateDefinition = Omit<Blueprint, 'name' | 'description'> & {
  name: string | LocalizedString;
  description?: string | LocalizedString;
  thumbnail?: string;
};

export function resolveLocalized(value: string | LocalizedString | undefined, lang: string) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const short = lang.split('-')[0];
  return value[lang] ?? value[short] ?? value.en ?? firstValue(value);
}

export function templateToBlueprint(template: TemplateDefinition, lang: string): Blueprint {
  const { thumbnail: _thumbnail, ...rest } = template;
  return {
    ...(rest as Blueprint),
    name: resolveLocalized(template.name, lang),
    description: resolveLocalized(template.description, lang) || undefined,
  };
}

function firstValue(value: LocalizedString) {
  const entries = Object.values(value);
  return entries.find(Boolean) ?? '';
}
