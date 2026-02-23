import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { RecentProject } from '@cardsmith/storage';
import { Badge, Button, Panel, Row } from '../../components/ui';
import { useTranslation } from 'react-i18next';
import { getCategoryLabel } from '../../utils/labels';
import type { TemplateDefinition } from '../../templates/types';
import { resolveLocalized } from '../../templates/types';

export function HomeScreen(props: {
  templates: TemplateDefinition[];
  recents: RecentProject[];
  onCreate: (name: string, templateId?: string) => void;
  onOpen: (filePath?: string) => void;
  onBrowseTemplates: () => void;
}) {
  const { t, i18n } = useTranslation();
  const defaultName = t('project.untitled');
  const defaultNameRef = useRef(defaultName);
  const [name, setName] = useState(defaultName);
  const [templateId, setTemplateId] = useState<string | undefined>(
    props.templates[0]?.id,
  );

  const templateOptions = useMemo(() => props.templates, [props.templates]);

  useEffect(() => {
    if (!templateId && props.templates[0]) {
      setTemplateId(props.templates[0].id);
    }
  }, [props.templates, templateId]);

  useEffect(() => {
    if (name === defaultNameRef.current) {
      setName(defaultName);
    }
    defaultNameRef.current = defaultName;
  }, [defaultName, name]);

  const lang = i18n.language;

  return (
    <div className="screen" style={{ padding: 24 }}>
      <div
        style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 1fr' }}
      >
        <Panel title={t('home.title')} subtitle={t('home.subtitle')}>
          <div className="list">
            <div>
              <div className="hint">{t('home.projectName')}</div>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <div className="hint">{t('home.templateLabel')}</div>
              <div className="grid-2" style={{ marginTop: 8 }}>
                {templateOptions.map((tpl) => {
                  const selected = tpl.id === templateId;
                  const tplName =
                    resolveLocalized(tpl.name, lang) ||
                    t('home.templateFallback');
                  const tplDesc =
                    resolveLocalized(tpl.description, lang) ||
                    t('home.templateFallback');
                  return (
                    <button
                      key={tpl.id}
                      className="list-item"
                      style={{
                        borderColor: selected
                          ? 'rgba(56,189,248,0.6)'
                          : undefined,
                        background: selected
                          ? 'rgba(56,189,248,0.08)'
                          : undefined,
                        textAlign: 'start',
                      }}
                      onClick={() => setTemplateId(tpl.id)}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{tplName}</div>
                        <div className="hint">{tplDesc}</div>
                      </div>
                      <Badge>{getCategoryLabel(t, tpl.category)}</Badge>
                    </button>
                  );
                })}
              </div>
            </div>
            <Row gap={10}>
              <Button onClick={() => props.onCreate(name, templateId)}>
                {t('home.createProject')}
              </Button>
              <Button variant="outline" onClick={() => props.onOpen()}>
                {t('home.openProject')}
              </Button>
              <Button variant="ghost" onClick={props.onBrowseTemplates}>
                {t('home.browseTemplates')}
              </Button>
            </Row>
          </div>
        </Panel>

        <Panel
          title={t('home.recentTitle')}
          subtitle={t('home.recentSubtitle')}
        >
          <div className="list">
            {props.recents.length === 0 ? (
              <div className="empty">{t('home.noRecents')}</div>
            ) : (
              props.recents.map((recent) => (
                <div key={recent.filePath} className="list-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{recent.name}</div>
                    <div className="hint">{recent.filePath}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => props.onOpen(recent.filePath)}
                  >
                    {t('common.open')}
                  </Button>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
