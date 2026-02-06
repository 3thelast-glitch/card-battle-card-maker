import React from 'react';
import type { CardArt, DataRow } from '../../../../../packages/core/src/index';
import { CardFrame } from '../../components/cards/CardFrame';
import { useTranslation } from 'react-i18next';
import { CARD_TEMPLATES, type TemplateKey } from '../../templates/cardTemplates';
import { Toggle } from '../../components/ui';

export function CardPreviewPanel(props: {
  row?: DataRow;
  defaultTemplate: TemplateKey;
  posterWarning?: string;
  showControls: boolean;
  onToggleControls: (next: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  if (!props.row) {
    return <div className="empty">{t('cards.empty')}</div>;
  }

  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const data = props.row.data ?? {};
  const art: CardArt | undefined = props.row.art ?? (data as any).art;
  const rarity = normalizeRarity(data.rarity);
  const templateKey = normalizeTemplateKey(data.templateKey ?? data.template, props.defaultTemplate);
  const bgColor = data.bgColor ?? CARD_TEMPLATES[templateKey]?.defaultBgColor;
  const title = data.name ?? data.title ?? data.character_name ?? data.character_name_en ?? data.character_name_ar ?? props.row.id;
  const desc = data.desc ?? data.ability ?? data.ability_en ?? data.ability_ar ?? '';
  const race = data.race;
  const traits = normalizeTraits(data.traits ?? data.trait);

  return (
    <div className="previewPanel">
      <div className="previewCanvas">
        <CardFrame
          rarity={rarity}
          art={art}
          templateKey={templateKey}
          title={title}
          description={desc}
          race={race}
          traits={traits}
          bgColor={bgColor}
          posterWarning={props.posterWarning}
          showControls={props.showControls}
          width={320}
          height={430}
        />
      </div>
      {art?.kind === 'video' ? (
        <div className="uiRow" style={{ marginTop: 12 }}>
          <Toggle
            checked={props.showControls}
            onChange={props.onToggleControls}
            label={t('data.showVideoControls')}
          />
        </div>
      ) : null}
      <div className="uiHelp" style={{ marginTop: 8 }}>
        {language === 'ar' ? getLocalizedValue(desc, 'ar') : getLocalizedValue(desc, 'en')}
      </div>
    </div>
  );
}

function normalizeTemplateKey(value: any, fallback: TemplateKey): TemplateKey {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'classic' || cleaned === 'moon' || cleaned === 'sand') return cleaned as TemplateKey;
  return fallback;
}

function normalizeRarity(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned;
  return 'common';
}

function normalizeTraits(value: any) {
  if (Array.isArray(value)) {
    return value.map((trait) => String(trait).toLowerCase().trim()).filter(Boolean);
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(/[,|]/g)
    .map((trait) => trait.trim().toLowerCase())
    .filter(Boolean);
}

function getLocalizedValue(value: any, language: 'en' | 'ar') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return String(value[language] ?? value.en ?? value.ar ?? '');
  }
  return value == null ? '' : String(value);
}
