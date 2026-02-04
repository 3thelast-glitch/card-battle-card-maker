import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Input, Panel, Select } from '../../components/ui';
import { useTranslation } from 'react-i18next';
import { getCategoryLabel } from '../../utils/labels';
import type { TemplateDefinition } from '../../templates/types';
import { resolveLocalized } from '../../templates/types';

export function TemplateGalleryScreen(props: {
  templates: TemplateDefinition[];
  onCreate: (name: string, templateId?: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const templates = props.templates;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const defaultName = t('project.untitled');
  const defaultNameRef = useRef(defaultName);
  const [projectName, setProjectName] = useState(defaultName);

  useEffect(() => {
    if (projectName === defaultNameRef.current) {
      setProjectName(defaultName);
    }
    defaultNameRef.current = defaultName;
  }, [defaultName, projectName]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((tpl) => set.add(tpl.category ?? 'General'));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [templates]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const lang = i18n.language;
    return templates.filter((tpl) => {
      const tplCategory = tpl.category ?? 'General';
      const categoryMatch = category === 'all' || tplCategory === category;
      const nameText = resolveLocalized(tpl.name, lang);
      const descText = resolveLocalized(tpl.description, lang);
      const haystack = `${nameText} ${descText} ${tplCategory}`.toLowerCase();
      const searchMatch = !term || haystack.includes(term);
      return categoryMatch && searchMatch;
    });
  }, [templates, search, category, i18n.language]);

  const createFromTemplate = (templateId: string) => {
    const name = projectName.trim() || t('project.untitled');
    props.onCreate(name, templateId);
  };

  return (
    <div className="screen" style={{ padding: 16 }}>
      <Panel title={t('templates.title')} subtitle={t('templates.subtitle')}>
        <div className="list">
          <div className="template-filters">
            <div>
              <div className="hint">{t('common.search')}</div>
              <Input
                placeholder={t('templates.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <div className="hint">{t('templates.categoryLabel')}</div>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">{t('templates.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{getCategoryLabel(t, cat)}</option>
                ))}
              </Select>
            </div>
            <div>
              <div className="hint">{t('templates.projectNameLabel')}</div>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
          </div>

          <div className="template-count">{t('templates.templateCount', { count: filtered.length })}</div>

          {filtered.length === 0 ? (
            <div className="empty">{t('templates.noTemplates')}</div>
          ) : (
            <div className="template-grid">
              {filtered.map((tpl) => {
                const thumb = tpl.thumbnail ?? '/assets/backgrounds/template-placeholder.svg';
                const nameText = resolveLocalized(tpl.name, i18n.language) || t('templates.descriptionFallback');
                const descText = resolveLocalized(tpl.description, i18n.language) || t('templates.descriptionFallback');
                return (
                  <div key={tpl.id} className="template-card">
                    <div className="template-thumb" style={{ backgroundImage: `url(${thumb})` }} />
                    <div className="template-meta">
                      <div className="template-name">{nameText}</div>
                      <div className="hint">{descText}</div>
                      <Badge>{getCategoryLabel(t, tpl.category)}</Badge>
                    </div>
                    <div className="template-actions">
                      <Button size="sm" onClick={() => createFromTemplate(tpl.id)}>
                        {t('templates.createFromTemplate')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
