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
      <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#12151E] border border-[#1E2435] flex items-center justify-center text-slate-600 text-lg">
          🃏
        </div>
        <p className="text-sm font-medium text-slate-500">{t('cards.empty')}</p>
        <p className="text-xs text-slate-700">{t('cards.emptyHint')}</p>
      </div>
    );
  }

  /* Rarity accent colours (dark-mode safe) */
  const rarityColor: Record<string, string> = {
    common: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    legendary: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="flex flex-col gap-1.5">
      {filtered.map((row) => {
        const data = row.data ?? {};
        const art = row.art ?? (data as any).art;
        const title = resolveName(data, props.language) || row.id;
        const rarity = normalizeRarity(data.rarity);
        const template = resolveTemplate(data);
        const stats = resolveStats(data);
        const thumb = resolveThumb(art);
        const isSelected = row.id === props.selectedId;

        return (
          <div
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => props.onSelect(row.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                props.onSelect(row.id);
              }
            }}
            className={[
              'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer',
              'transition-all duration-150 select-none outline-none',
              'focus-visible:ring-1 focus-visible:ring-blue-500/50',
              isSelected
                ? 'border-blue-500/50 bg-blue-500/[0.07] ring-1 ring-blue-500/20'
                : 'border-[#1E2435] bg-[#0D1117] hover:border-[#2D3A5A] hover:bg-[#0F1520]',
            ].join(' ')}
          >
            {/* Thumbnail */}
            < div
              className={[
                'w-12 h-12 flex-shrink-0 rounded-md border bg-[#12151E] bg-cover bg-center',
                isSelected ? 'border-blue-500/40' : 'border-[#1E2435]',
              ].join(' ')}
              style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
            >
              {!thumb && (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-lg">🃏</div>
              )}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              {/* Title */}
              <div className={[
                'text-sm font-semibold truncate leading-tight',
                isSelected ? 'text-blue-300' : 'text-slate-200',
              ].join(' ')}>
                {title}
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${rarityColor[rarity] ?? rarityColor.common}`}>
                  {getRarityLabel(rarity, props.language)}
                </span>
                {template && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md border border-[#1E2435] bg-[#12151E] text-[10px] font-medium text-slate-500">
                    {getTemplateLabel(template, props.language)}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2.5 text-[10px] font-mono">
                <span className="flex items-center gap-0.5 text-rose-400/80">
                  ⚔ {stats.attack}
                </span>
                <span className="flex items-center gap-0.5 text-sky-400/80">
                  🛡 {stats.defense}
                </span>
                {stats.cost != null && (
                  <span className="text-amber-400/70">✦ {stats.cost}</span>
                )}
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
