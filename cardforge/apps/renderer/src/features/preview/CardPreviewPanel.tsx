import { useRef, useState, type PointerEvent } from 'react';
import { LayoutTemplate, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
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
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset]">
          <LayoutTemplate size={28} className="text-slate-600" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-400">{t('cards.selectPreview')}</p>
          <p className="text-xs text-slate-600 max-w-[200px] mx-auto leading-relaxed">
            Select a card from the list to preview it here
          </p>
        </div>
      </div>
    );
  }

  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const data = props.row.data ?? {};
  const art: CardArt | undefined = props.row.art ?? (data as any).art;
  const rarity = normalizeRarity(data.rarity);
  const templateKey = normalizeTemplateKey(data.templateKey ?? data.template, props.defaultTemplate);
  const bgColor = data.bgColor ?? CARD_TEMPLATES[templateKey]?.defaultBgColor;
  const attack = normalizeNumber(data.attack ?? data.stats?.attack);
  const defense = normalizeNumber(data.defense ?? data.stats?.defense);
  const title = data.name ?? data.title ?? data.character_name ?? data.character_name_en ?? data.character_name_ar ?? props.row.id;
  const desc = data.desc ?? data.ability ?? data.ability_en ?? data.ability_ar ?? '';
  const element = data.element;
  const race = data.race;
  const traits = normalizeTraits(data.traits ?? data.trait);
  const artTransform = normalizeArtTransform(art?.transform);
  const template = CARD_TEMPLATES[templateKey] ?? CARD_TEMPLATES[props.defaultTemplate];
  const canDrag = Boolean(props.onUpdateArtTransform && art);
  const dragEnabled = canDrag && !(art?.kind === 'video' && props.showControls);
  const previewWidth = 320;
  const previewHeight = 430;

  // — Zoom state (UI-only, does not affect CardFrame data) —
  const ZOOM_STEPS = [0.4, 0.5, 0.6, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5];
  const DEFAULT_ZOOM_IDX = 4; // 1.0
  const [zoomIdx, setZoomIdx] = useState(DEFAULT_ZOOM_IDX);
  const zoom = ZOOM_STEPS[zoomIdx];
  const zoomIn = () => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  const zoomOut = () => setZoomIdx((i) => Math.max(i - 1, 0));
  const zoomFit = () => setZoomIdx(DEFAULT_ZOOM_IDX);

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
    /* Designer canvas stage */
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Flat dark canvas — Figma workspace feel */}
      <div
        className="flex-1 flex items-center justify-center min-h-0 relative overflow-hidden"
        style={{
          backgroundColor: '#0C1018',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Card — deep shadow so it pops like a physical card on a desk */}
        <div
          className="flex-shrink-0 rounded-[inherit]"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.80)) drop-shadow(0 4px 12px rgba(0,0,0,0.50))',
          }}
        >
          <CardFrame
            rarity={rarity as any}
            bgColor={bgColor}
            art={art}
            templateKey={templateKey}
            title={title}
            description={desc}
            element={element as any}
            race={race as any}
            traits={traits as any}
            attack={attack}
            defense={defense}
            posterWarning={props.posterWarning}
            showControls={props.showControls}
            width={previewWidth}
            height={previewHeight}
            artInteractive={Boolean(props.onUpdateArtTransform)}
            onArtPointerDown={handlePointerDown}
            onArtPointerMove={handlePointerMove}
            onArtPointerUp={handlePointerUp}
            onArtPointerLeave={handlePointerUp}
          />
        </div>

        {/* Video controls — flat pill matching dark panel borders */}
        {art?.kind === 'video' && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#0F1520]/90 backdrop-blur-md border border-[#2A3040] shadow-xl">
              <Toggle
                checked={props.showControls}
                onChange={props.onToggleControls}
                label={t('data.showVideoControls')}
              />
            </div>
          </div>
        )}

        {/* ─── Floating Zoom Toolbar ─── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center">
          <div className={[
            'flex items-center gap-0.5 px-1.5 py-1.5 rounded-full',
            'bg-[#0F1520]/90 backdrop-blur-md',
            'border border-[#2A3040]',
            'shadow-[0_8px_24px_rgba(0,0,0,0.60)]',
          ].join(' ')}>

            {/* Zoom Out */}
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoomIdx === 0}
              title="Zoom out"
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut size={13} />
            </button>

            {/* Zoom level label */}
            <button
              type="button"
              onClick={zoomFit}
              title="Reset to 100%"
              className="px-2 py-0.5 rounded-md text-xs font-semibold font-mono text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors min-w-[44px] text-center"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom In */}
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
              title="Zoom in"
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn size={13} />
            </button>

            {/* Divider */}
            <div className="w-px h-4 bg-[#2A3040] mx-1" />

            {/* Fit / Reset */}
            <button
              type="button"
              onClick={zoomFit}
              title="Reset zoom"
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Description strip */}
      {desc && (
        <div className="flex-shrink-0 px-4 py-2.5 border-t border-[#1A1F2E]">
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {language === 'ar' ? getLocalizedValue(desc, 'ar') : getLocalizedValue(desc, 'en')}
          </p>
        </div>
      )}
    </div>
  );
}

function normalizeTemplateKey(value: any, fallback: TemplateKey): TemplateKey {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned && Object.prototype.hasOwnProperty.call(CARD_TEMPLATES, cleaned)) {
    return cleaned as TemplateKey;
  }
  return fallback;
}

function normalizeRarity(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned;
  return 'common';
}

function normalizeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
    rotate: Number.isFinite(value?.rotate) ? Math.max(-180, Math.min(180, value!.rotate)) : 0,
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
