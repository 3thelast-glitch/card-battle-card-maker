import { useMemo } from 'react';
import type { DataRow } from '../../../../../packages/core/src/index';
import type { Rarity } from '../../lib/balanceRules';
import { useTranslation } from 'react-i18next';
import { CARD_TEMPLATES, type TemplateKey } from '../../templates/cardTemplates';

export type CardFilters = {
  query: string;
  rarity: '' | Rarity;
  template: string;
  tag: string;
};

export function filterCards(rows: DataRow[], filters: CardFilters, language: 'en' | 'ar') {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    const data = row.data ?? {};
    if (filters.rarity) {
      const rarity = normalizeRarity(data.rarity);
      if (rarity !== filters.rarity) return false;
    }
    if (filters.template) {
      const template = resolveTemplate(data);
      if (template !== filters.template) return false;
    }
    if (filters.tag) {
      const tags = extractTags(data);
      if (!tags.includes(filters.tag)) return false;
    }
    if (query) {
      const name = resolveName(data, language).toLowerCase();
      const alt = resolveName(data, language === 'en' ? 'ar' : 'en').toLowerCase();
      if (!name.includes(query) && !alt.includes(query)) return false;
    }
    return true;
  });
}

export function CardList(props: {
  cards: DataRow[];
  selectedId?: string;
  onSelect: (id: string) => void;
  filters: CardFilters;
  language: 'en' | 'ar';
}) {
  const { t } = useTranslation();
  const filtered = useMemo(
    () => filterCards(props.cards, props.filters, props.language),
    [props.cards, props.filters, props.language],
  );

  if (!filtered.length) {
    return (
      <div className="empty">
        {t('cards.empty')}
        <div className="uiHelp">{t('cards.emptyHint')}</div>
      </div>
    );
  }

  return (
    <div className="cardList">
      {filtered.map((row) => {
        const data = row.data ?? {};
        const art = row.art ?? (data as any).art;
        const title = resolveName(data, props.language) || row.id;
        const rarity = normalizeRarity(data.rarity);
        const template = resolveTemplate(data);
        const stats = resolveStats(data);
        const thumb = resolveThumb(art);
        return (
          <div
            key={row.id}
            className={`cardListItem ${row.id === props.selectedId ? 'isSelected' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => props.onSelect(row.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                props.onSelect(row.id);
              }
            }}
          >
            <div
              className="cardListThumb"
              style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
            />
            <div className="cardListMeta">
              <div className="cardListTitle">{title}</div>
              <div className="cardListBadges">
                <span className="cardListBadge">{getRarityLabel(rarity, props.language)}</span>
                <span className="cardListBadge">{getTemplateLabel(template, props.language)}</span>
              </div>
              <div className="cardListStats">
                <span>ATK {stats.attack}</span>
                <span>DEF {stats.defense}</span>
                {stats.cost != null ? <span>COST {stats.cost}</span> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function resolveName(data: Record<string, any>, language: 'en' | 'ar') {
  const value = data.name ?? data.title ?? data.character_name ?? data.character_name_en ?? data.character_name_ar;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return String(value[language] ?? value.en ?? value.ar ?? '');
  }
  return value == null ? '' : String(value);
}

function resolveStats(data: Record<string, any>) {
  const attack = normalizeNumber(data.attack ?? data.stats?.attack);
  const defense = normalizeNumber(data.defense ?? data.stats?.defense);
  const cost = data.cost != null ? normalizeNumber(data.cost) : null;
  return { attack, defense, cost };
}

function resolveTemplate(data: Record<string, any>) {
  return String(data.templateKey ?? data.template ?? data.template_key ?? '').toLowerCase().trim();
}

function resolveThumb(art?: { kind?: string; src?: string; poster?: string }) {
  if (!art) return '';
  if (art.kind === 'video') return art.poster ?? '';
  if (art.kind === 'image') return art.src ?? '';
  return '';
}

function normalizeRarity(value: any): Rarity {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned as Rarity;
  return 'common';
}

function normalizeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractTags(data: Record<string, any>) {
  const raw = data.tags ?? data.tag;
  if (Array.isArray(raw)) {
    return raw.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function getRarityLabel(rarity: Rarity, language: 'en' | 'ar') {
  const labels = {
    common: { en: 'Common', ar: 'عادي' },
    rare: { en: 'Rare', ar: 'نادر' },
    epic: { en: 'Epic', ar: 'ملحمي' },
    legendary: { en: 'Legendary', ar: 'أسطوري' },
  } as const;
  return labels[rarity][language] ?? labels[rarity].en;
}

function getTemplateLabel(template: string, language: 'en' | 'ar') {
  const tpl = CARD_TEMPLATES[template as TemplateKey];
  if (!tpl) return template || 'classic';
  return tpl.label[language] ?? tpl.label.en;
}
