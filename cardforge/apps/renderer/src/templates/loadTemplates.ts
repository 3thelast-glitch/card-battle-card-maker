import type { TemplateDefinition } from './types';

export function loadBuiltInTemplates(): TemplateDefinition[] {
  const modules = import.meta.glob('@templates/*.json', { eager: true });
  const templates: TemplateDefinition[] = Object.values(modules).map((mod: any) => {
    const tpl = (mod?.default ?? mod) as TemplateDefinition;
    return {
      ...tpl,
      category: tpl.category ?? 'General',
      thumbnail: tpl.thumbnail ?? '/assets/backgrounds/template-placeholder.svg',
    };
  });
  return templates.sort((a, b) => getTemplateSortName(a).localeCompare(getTemplateSortName(b)));
}

function getTemplateSortName(template: TemplateDefinition) {
  if (typeof template.name === 'string') return template.name;
  return template.name.en ?? Object.values(template.name)[0] ?? '';
}
