import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RARITY_COLORS, Rarity } from '../../shared/cardRarityColors';
import type { CardArt } from '../../../../../packages/core/src/model';
import { CARD_TEMPLATES, TemplateKey } from '../../templates/cardTemplates';

type Props = {
  rarity: Rarity;
  bgColor?: string;
  art?: CardArt;
  templateKey?: TemplateKey;
  title?: string | { en?: string; ar?: string };
  description?: string | { en?: string; ar?: string };
  badgeText?: string;
  posterWarning?: string;
  showControls?: boolean;
  width?: number;
  height?: number;
};

const FRAME_SRC = new URL('../../assets/images/card-frames/frame_base.png', import.meta.url).href;

type Spark = { left: number; bottom: number; delay: number };

function hexToRgb(hex: string) {
  const cleaned = hex.replace('#', '');
  const normalized =
    cleaned.length === 3 ? cleaned.split('').map((char) => `${char}${char}`).join('') : cleaned;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CardFrame({
  rarity,
  bgColor,
  art,
  templateKey = 'classic',
  title,
  description,
  badgeText,
  posterWarning,
  showControls,
  width = 280,
  height = 360,
}: Props) {
  const { i18n } = useTranslation();
  const tint = RARITY_COLORS[rarity];
  const isRare = rarity === 'rare';
  const isEpic = rarity === 'epic';
  const isLegendary = rarity === 'legendary';
  const [hovered, setHovered] = useState(false);
  const template = CARD_TEMPLATES[templateKey] ?? CARD_TEMPLATES.classic;
  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const resolvedBg = bgColor ?? template.defaultBgColor ?? '#2b0d16';
  const resolvedTitle = resolveLocalized(title, language);
  const resolvedDesc = resolveLocalized(description, language);
  const badge = badgeText ?? template.badge?.text;
  const badgePos = template.badge ?? { x: width - 44, y: 12 };

  const glow = useMemo(() => {
    if (!isRare && !isEpic && !isLegendary) return 'none';
    const blur = isLegendary ? 28 : isEpic ? 22 : 16;
    const alpha = isLegendary ? 0.85 : isEpic ? 0.7 : 0.55;
    return `0 0 ${blur}px ${hexToRgba(tint, alpha)}`;
  }, [isEpic, isLegendary, isRare, tint]);

  const sparks: Spark[] = useMemo(() => {
    if (!isLegendary) return [];
    const maxLeft = Math.max(40, width - 40);
    return Array.from({ length: 4 }).map(() => ({
      left: Math.floor(Math.random() * maxLeft) + 10,
      bottom: Math.floor(Math.random() * 60) + 30,
      delay: Math.floor(Math.random() * 900),
    }));
  }, [isLegendary, width]);

  const frameVars = {
    width,
    height,
    '--frame-tint': tint,
    '--frame-bg': resolvedBg,
  } as React.CSSProperties;

  const frameStyle = {
    WebkitMaskImage: `url(${FRAME_SRC})`,
    maskImage: `url(${FRAME_SRC})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    boxShadow: glow,
  } as React.CSSProperties;

  const controlsEnabled = showControls ? true : hovered;

  const artRectStyle: React.CSSProperties = {
    left: template.artRect.left,
    right: template.artRect.right,
    top: template.artRect.top,
    bottom: template.artRect.bottom,
    borderRadius: template.artRect.radius,
  };

  const titleStyle: React.CSSProperties = {
    left: template.title.x,
    right: template.title.x,
    top: template.title.y,
    fontSize: template.title.size,
    letterSpacing: template.title.letterSpacing ?? 0,
  };

  const descStyle: React.CSSProperties = {
    left: template.desc.x,
    right: template.desc.x,
    top: template.desc.y,
    fontSize: template.desc.size,
    WebkitLineClamp: template.desc.maxLines ?? 3,
  };

  return (
    <div className={`card-frame card-frame--${rarity} card-frame--${template.key}`} style={frameVars}>
      <div className="card-frame__bg" />
      <div
        className="card-frame__art"
        style={artRectStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {art?.kind === 'image' ? (
          <img className="card-frame__media" src={art.src} alt="" draggable={false} />
        ) : null}
        {art?.kind === 'video' ? (
          <video
            className="card-frame__media"
            src={art.src}
            poster={art.poster}
            playsInline
            muted
            loop
            autoPlay
            preload="metadata"
            controls={controlsEnabled}
          />
        ) : null}
      </div>
      {resolvedTitle ? (
        <div className="card-frame__title" style={titleStyle}>
          {resolvedTitle}
        </div>
      ) : null}
      {badge ? (
        <div className="card-frame__badge" style={{ left: badgePos.x, top: badgePos.y }}>
          {badge}
        </div>
      ) : null}
      {resolvedDesc ? (
        <div className="card-frame__desc" style={descStyle}>
          {resolvedDesc}
        </div>
      ) : null}
      {posterWarning && art?.kind === 'video' && !art.poster ? (
        <div className="card-frame__warning">{posterWarning}</div>
      ) : null}
      <div className="card-frame__frame" style={frameStyle} />
      {(isEpic || isLegendary) && <div className="card-frame__sweep" />}
      {isLegendary
        ? sparks.map((spark, index) => (
            <div
              key={index}
              className="card-frame__spark"
              style={{ left: spark.left, bottom: spark.bottom, animationDelay: `${spark.delay}ms` }}
            />
          ))
        : null}
    </div>
  );
}

function resolveLocalized(value: Props['title'], language: 'en' | 'ar') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] ?? value.en ?? value.ar ?? '';
}
