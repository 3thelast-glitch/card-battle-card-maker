import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui';
import {
  CARD_TEMPLATES,
  type TemplateKey,
} from '../../templates/cardTemplates';

type Props = {
  value: TemplateKey;
  language: 'en' | 'ar';
  onChange: (next: TemplateKey) => void;
};

export function TemplatePicker({ value, language, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const templates = useMemo(() => Object.values(CARD_TEMPLATES), []);
  const selected =
    templates.find((template) => template.key === value) ?? templates[0];

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((template) => {
      const nameEn = template.label.en.toLowerCase();
      const nameAr = template.label.ar.toLowerCase();
      return (
        nameEn.includes(q) || nameAr.includes(q) || template.key.includes(q)
      );
    });
  }, [query, templates]);

  const handleSelect = (key: TemplateKey) => {
    onChange(key);
    setOpen(false);
  };

  const titleFor = (key: TemplateKey, fallback?: string, customKey?: string) =>
    t(customKey ?? `templates.${key}.title`, { defaultValue: fallback ?? key });
  const descriptionFor = (key: TemplateKey, customKey?: string) =>
    t(customKey ?? `templates.${key}.desc`, {
      defaultValue: t('templates.descriptionFallback'),
    });

  const thumbStyle = (color?: string, thumbnail?: string) => {
    const base = `linear-gradient(160deg, ${color ?? 'rgba(255,255,255,0.08)'}, rgba(0,0,0,0.35))`;
    if (thumbnail) {
      return {
        backgroundImage: `${base}, url(${thumbnail})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } as const;
    }
    return { background: base };
  };

  return (
    <>
      <button
        type="button"
        className="templatePickerField"
        onClick={() => setOpen(true)}
      >
        <div
          className="templatePickerThumb"
          style={thumbStyle(selected?.defaultBgColor, selected?.thumbnail)}
        />
        <div className="templatePickerMeta">
          <div className="templatePickerTitle">
            {selected
              ? titleFor(
                  selected.key,
                  selected.label[language] ?? selected.label.en,
                  selected.titleKey,
                )
              : ''}
          </div>
          <div className="templatePickerDesc">
            {descriptionFor(selected?.key ?? 'classic', selected?.descKey)}
          </div>
        </div>
        <span className="uiBtn uiBtnOutline templatePickerCta">
          {t('templates.change')}
        </span>
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="templateModalOverlay"
              onMouseDown={() => setOpen(false)}
            >
              <div
                className="templateModal"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="templateModalHeader">
                  <div>
                    <div className="uiTitle">{t('templates.title')}</div>
                    <div className="uiSub">{t('templates.select')}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    {t('common.close')}
                  </Button>
                </div>
                <div className="templateModalBody">
                  <input
                    className="uiInput"
                    placeholder={t('templates.search')}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="templateGrid">
                    {filtered.map((template) => (
                      <div
                        key={template.key}
                        className={`templateCard ${template.key === value ? 'isSelected' : ''}`}
                        onClick={() => handleSelect(template.key)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelect(template.key);
                          }
                        }}
                      >
                        <div
                          className="templateCardThumb"
                          style={thumbStyle(
                            template.defaultBgColor,
                            template.thumbnail,
                          )}
                        />
                        {template.key === value ? (
                          <span className="templateCardCheck">✓</span>
                        ) : null}
                        <div className="templateCardMeta">
                          <div className="templateCardTitle">
                            {titleFor(
                              template.key,
                              template.label[language] ?? template.label.en,
                              template.titleKey,
                            )}
                          </div>
                          <div className="templateCardDesc">
                            {descriptionFor(template.key, template.descKey)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
