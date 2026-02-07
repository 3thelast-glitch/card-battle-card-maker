import { useRef, type PointerEvent } from 'react';
import type { ArtTransform, CardArt, DataRow } from '../../../../../packages/core/src/index';
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
  onUpdateArtTransform?: (next: ArtTransform) => void;
}) {
  const { t, i18n } = useTranslation();
  const dragState = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    pointerId: number;
  } | null>(null);

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
  const artTransform = normalizeArtTransform(art?.transform);
  const template = CARD_TEMPLATES[templateKey] ?? CARD_TEMPLATES[props.defaultTemplate];
  const canDrag = Boolean(props.onUpdateArtTransform && art);
  const dragEnabled = canDrag && !(art?.kind === 'video' && props.showControls);
  const previewWidth = 320;
  const previewHeight = 430;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragEnabled) return;
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: artTransform.x,
      baseY: artTransform.y,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragEnabled || !props.onUpdateArtTransform) return;
    const state = dragState.current;
    if (!state) return;
    const next = clampArtTransform(
      {
        ...artTransform,
        x: state.baseX + (event.clientX - state.startX),
        y: state.baseY + (event.clientY - state.startY),
      },
      template?.artRect,
      previewWidth,
      previewHeight,
    );
    props.onUpdateArtTransform(next);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    if (!state) return;
    dragState.current = null;
    event.currentTarget.releasePointerCapture?.(state.pointerId);
  };

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
          width={previewWidth}
          height={previewHeight}
          artInteractive={dragEnabled}
          onArtPointerDown={handlePointerDown}
          onArtPointerMove={handlePointerMove}
          onArtPointerUp={handlePointerUp}
          onArtPointerLeave={handlePointerUp}
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

function normalizeArtTransform(value?: ArtTransform): ArtTransform {
  return {
    x: Number.isFinite(value?.x) ? value!.x : 0,
    y: Number.isFinite(value?.y) ? value!.y : 0,
    scale: Number.isFinite(value?.scale) ? value!.scale : 1,
    fit: value?.fit === 'contain' ? 'contain' : 'cover',
  };
}

function clampArtTransform(
  value: ArtTransform,
  artRect: { left: number; right: number; top: number; bottom: number } | undefined,
  frameWidth: number,
  frameHeight: number,
) {
  const scale = Math.min(2.5, Math.max(0.6, value.scale || 1));
  if (!artRect) {
    return { ...value, scale };
  }
  const artWidth = Math.max(1, frameWidth - artRect.left - artRect.right);
  const artHeight = Math.max(1, frameHeight - artRect.top - artRect.bottom);
  const maxOffsetX = Math.max(0, (artWidth * scale - artWidth) / 2);
  const maxOffsetY = Math.max(0, (artHeight * scale - artHeight) / 2);
  return {
    ...value,
    scale,
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, value.x || 0)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, value.y || 0)),
  };
}
