import { useEffect, useMemo, useState, type CSSProperties, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { RARITY_COLORS, Rarity } from '../../shared/cardRarityColors';
import type { ArtTransform, CardArt, CardRace, CardTrait, ElementKey } from '../../../../../packages/core/src/index';
import { CARD_TEMPLATES, TemplateKey } from '../../templates/cardTemplates';
import { RaceIcon } from '../../ui/icons/raceIcons';
import { TraitIcon, TRAIT_META } from '../../ui/icons/traitIcons';
import { ELEMENTS, getMatchup } from '../../lib/elements';

type Props = {
  rarity: Rarity;
  bgColor?: string;
  art?: CardArt;
  templateKey?: TemplateKey;
  title?: string | { en?: string; ar?: string };
  description?: string | { en?: string; ar?: string };
  badgeText?: string;
  race?: CardRace;
  traits?: CardTrait[];
  element?: ElementKey;
  attack?: number;
  defense?: number;
  badgeStyle?: BadgeStyleConfig;
  posterWarning?: string;
  showControls?: boolean;
  width?: number;
  height?: number;
  artInteractive?: boolean;
  onArtPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onArtPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onArtPointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
  onArtPointerLeave?: (event: PointerEvent<HTMLDivElement>) => void;
};

const FRAME_SRC = new URL('../../assets/images/card-frames/frame_base.png', import.meta.url).href;

type Spark = { left: number; bottom: number; delay: number };

type BadgeStyle = {
  scale?: number;
  color?: string;
  iconUrl?: string;
};

type BadgeStyleConfig = {
  attackBadge?: BadgeStyle;
  defenseBadge?: BadgeStyle;
  elementBadge?: BadgeStyle;
  tribe?: BadgeStyle;
};

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
  race,
  traits = [],
  element,
  attack,
  defense,
  badgeStyle,
  posterWarning,
  showControls,
  width = 280,
  height = 360,
  artInteractive,
  onArtPointerDown,
  onArtPointerMove,
  onArtPointerUp,
  onArtPointerLeave,
}: Props) {
  const { i18n, t } = useTranslation();
  const tint = RARITY_COLORS[rarity];
  const isRare = rarity === 'rare';
  const isEpic = rarity === 'epic';
  const isLegendary = rarity === 'legendary';
  const [hovered, setHovered] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const template = CARD_TEMPLATES[templateKey] ?? CARD_TEMPLATES.classic;
  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const resolvedBg = bgColor ?? template.defaultBgColor ?? '#2b0d16';
  const resolvedTitle = resolveLocalized(title, language);
  const resolvedDesc = resolveLocalized(description, language);
  const badge = badgeText ?? template.badge?.text;
  const badgePos = template.badge ?? { x: width - 44, y: 12 };
  const badgeTop = resolvedTitle
    ? template.title.y + template.title.size + 6
    : template.artRect.top + 6;
  const tribeBadge = normalizeBadgeStyle(badgeStyle?.tribe);
  const metaBadgeStyle: CSSProperties = {
    left: template.title.x,
    right: template.title.x,
    top: badgeTop,
  };
  const traitList = Array.isArray(traits) ? traits.filter(Boolean) : [];
  const trimmedTraits = traitList.map((trait) => String(trait));
  const maxVisibleTraits = 6;
  const visibleTraits = trimmedTraits.slice(0, maxVisibleTraits);
  const extraTraitCount = Math.max(0, trimmedTraits.length - visibleTraits.length);
  const raceKey = race ? String(race).toLowerCase() : '';
  const elementKey = element ? String(element).toLowerCase() : '';
  const elementInfo = elementKey && ELEMENTS[elementKey as ElementKey];
  const matchup = elementInfo ? getMatchup(elementKey as ElementKey) : { weakTo: [], strongAgainst: [], resist: [] };
  const weakKey = matchup.weakTo[0];
  const strongKey = matchup.strongAgainst[0];
  const weakInfo = weakKey ? ELEMENTS[weakKey] : undefined;
  const strongInfo = strongKey ? ELEMENTS[strongKey] : undefined;
  const attackValue = normalizeStat(attack);
  const defenseValue = normalizeStat(defense);
  const attackBadge = normalizeBadgeStyle(badgeStyle?.attackBadge);
  const defenseBadge = normalizeBadgeStyle(badgeStyle?.defenseBadge);
  const elementBadge = normalizeBadgeStyle(badgeStyle?.elementBadge);

  const attackStyle = buildStatStyle(
    attackBadge.color || tint,
    isLegendary,
    isEpic,
    attackBadge.scale,
    'left bottom',
    attackBadge.color,
  );
  const defenseStyle = buildStatStyle(
    defenseBadge.color || tint,
    isLegendary,
    isEpic,
    defenseBadge.scale,
    'right bottom',
    defenseBadge.color,
  );
  const elementColor = elementBadge.color || elementInfo?.color;
  const elementContainerStyle: CSSProperties = {
    transform: `scale(${elementBadge.scale})`,
    transformOrigin: 'left top',
  };

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
  } as CSSProperties;

  const frameStyle = {
    WebkitMaskImage: `url(${FRAME_SRC})`,
    maskImage: `url(${FRAME_SRC})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    boxShadow: glow,
  } as CSSProperties;

  const controlsEnabled = showControls ? true : hovered;
  const showVideo = art?.kind === 'video' && artInteractive && !videoFailed;
  const showPoster = art?.kind === 'video' && !showVideo && art?.poster;

  useEffect(() => {
    setVideoFailed(false);
  }, [art?.src, art?.poster]);

  const artRectStyle: CSSProperties = {
    left: template.artRect.left,
    right: template.artRect.right,
    top: template.artRect.top,
    bottom: template.artRect.bottom,
    borderRadius: template.artRect.radius,
  };
  const artTransform = normalizeArtTransform(art?.transform);
  const artMaskClass = `card-frame__art cardArtMask${artInteractive ? ' cardArtMask--interactive' : ''}`;

  const titleStyle: CSSProperties = {
    left: template.title.x,
    right: template.title.x,
    top: template.title.y,
    fontSize: template.title.size,
    letterSpacing: template.title.letterSpacing ?? 0,
  };

  const descStyle: CSSProperties = {
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
        className={artMaskClass}
        style={artRectStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onPointerDown={onArtPointerDown}
        onPointerMove={onArtPointerMove}
        onPointerUp={onArtPointerUp}
        onPointerLeave={onArtPointerLeave}
      >
        <div
          className="cardArtInner"
          style={{
            transform: `translate(${artTransform.x}px, ${artTransform.y}px) scale(${artTransform.scale}) rotate(${artTransform.rotate}deg)`,
          }}
        >
          {art?.kind === 'image' ? (
            <img
              className="card-frame__media cardArtMedia"
              src={art.src}
              alt=""
              draggable={false}
              style={{ objectFit: artTransform.fit }}
            />
          ) : null}
          {showVideo ? (
            <video
              className="card-frame__media cardArtMedia"
              src={art.src}
              poster={art.poster}
              playsInline
              muted
              loop
              autoPlay
              preload="metadata"
              onError={() => setVideoFailed(true)}
              controls={controlsEnabled}
              style={{ objectFit: artTransform.fit }}
            />
          ) : null}
          {showPoster ? (
            <img
              className="card-frame__media cardArtMedia"
              src={art!.poster!}
              alt=""
              draggable={false}
              style={{ objectFit: artTransform.fit }}
            />
          ) : null}
        </div>
      </div>
      <div className="cardOverlays">
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
        {raceKey || trimmedTraits.length ? (
          <div className="metaBadges" style={metaBadgeStyle}>
            {raceKey ? (
              <span
                className={`metaBadge metaBadge--race metaBadge--${raceKey}`}
                title={t(`races.${raceKey}`, { defaultValue: raceKey })}
                style={{
                  backgroundColor: tribeBadge.color || undefined,
                  transform: `scale(${tribeBadge.scale})`,
                }}
              >
                <RaceIcon race={raceKey as CardRace} size={14} />
              </span>
            ) : null}
            {visibleTraits.map((trait, index) => {
              const key = trait.toLowerCase();
              const meta = TRAIT_META[key];
              const className = `traitBadge${meta ? ` traitBadge--${meta.tintClass}` : ''}`;
              return (
                <span
                  key={`${key}-${index}`}
                  className={className}
                  title={t(`traits.${key}`, { defaultValue: trait })}
                  style={{
                    backgroundColor: tribeBadge.color || undefined,
                    transform: `scale(${tribeBadge.scale})`,
                  }}
                >
                  <TraitIcon trait={key} size={12} />
                </span>
              );
            })}
            {extraTraitCount > 0 ? (
              <span className="traitBadge traitBadge--more" title={t('cards.meta.traits')}>
                +{extraTraitCount}
              </span>
            ) : null}
          </div>
        ) : null}
        {resolvedDesc ? (
          <div className="card-frame__desc" style={descStyle}>
            {resolvedDesc}
          </div>
        ) : null}
        {elementInfo ? (
          <div className="elementBadge" aria-label={t(elementInfo.labelKey)} style={elementContainerStyle}>
            <div
              className="elementHex"
              style={{
                borderColor: elementColor,
                backgroundColor: elementBadge.color ? hexToRgba(elementBadge.color, 0.8) : undefined,
                boxShadow: elementColor ? `0 0 12px ${toGlowColor(elementColor, 0.35)}` : undefined,
              }}
              title={t(elementInfo.labelKey)}
            >
              {elementBadge.iconUrl ? (
                <img src={elementBadge.iconUrl} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
              ) : (
                <span>{elementInfo.icon}</span>
              )}
            </div>
            <div className="elementMiniRow">
              {weakInfo ? (
                <div className="elementMini elementMini--weak" title={t('elements.weakTo')}>
                  <span className="elementMiniArrow">v</span>
                  <span>{weakInfo.icon}</span>
                </div>
              ) : null}
              {strongInfo ? (
                <div className="elementMini elementMini--strong" title={t('elements.strongAgainst')}>
                  <span className="elementMiniArrow">^</span>
                  <span>{strongInfo.icon}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {attackValue != null ? (
          <div className="statBadge statBadge--atk" style={attackStyle} title={t('stats.atk', { defaultValue: 'ATK' })}>
            <span className="statIcon" aria-hidden="true">
              {attackBadge.iconUrl ? (
                <img src={attackBadge.iconUrl} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
              ) : (
                <StatIcon kind="atk" />
              )}
            </span>
            <div className="statValue">{attackValue}</div>
            <div className="statLabel">{t('stats.atk', { defaultValue: 'ATK' })}</div>
          </div>
        ) : null}
        {defenseValue != null ? (
          <div className="statBadge statBadge--def" style={defenseStyle} title={t('stats.def', { defaultValue: 'DEF' })}>
            <span className="statIcon" aria-hidden="true">
              {defenseBadge.iconUrl ? (
                <img src={defenseBadge.iconUrl} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
              ) : (
                <StatIcon kind="def" />
              )}
            </span>
            <div className="statValue">{defenseValue}</div>
            <div className="statLabel">{t('stats.def', { defaultValue: 'DEF' })}</div>
          </div>
        ) : null}
        {posterWarning && art?.kind === 'video' && !art.poster ? (
          <div className="card-frame__warning">{posterWarning}</div>
        ) : null}
      </div>
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

function normalizeStat(value?: number) {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value as number));
}

function normalizeArtTransform(value?: ArtTransform): ArtTransform {
  return {
    x: Number.isFinite(value?.x) ? value!.x : 0,
    y: Number.isFinite(value?.y) ? value!.y : 0,
    scale: Number.isFinite(value?.scale) ? Math.min(3, Math.max(0.5, value!.scale)) : 1,
    rotate: Number.isFinite(value?.rotate) ? Math.max(-180, Math.min(180, value!.rotate)) : 0,
    fit: value?.fit === 'contain' ? 'contain' : 'cover',
  };
}

function normalizeBadgeStyle(style?: BadgeStyle): Required<BadgeStyle> {
  const scale = clampNumber(Number(style?.scale ?? 1), 0.5, 2);
  const color = String(style?.color ?? '').trim();
  const iconUrl = String(style?.iconUrl ?? '').trim();
  return {
    scale,
    color: color || '',
    iconUrl: iconUrl || '',
  };
}

function buildStatStyle(
  color: string,
  isLegendary: boolean,
  isEpic: boolean,
  scale: number,
  origin: string,
  explicitColor?: string,
): CSSProperties {
  const safeColor = color || '#ffffff';
  const borderColor = isHexColor(safeColor) ? hexToRgba(safeColor, 0.55) : safeColor;
  const glow = isHexColor(safeColor)
    ? hexToRgba(safeColor, isLegendary ? 0.5 : isEpic ? 0.4 : 0.3)
    : safeColor;
  const backgroundColor = explicitColor
    ? (isHexColor(explicitColor) ? hexToRgba(explicitColor, 0.8) : explicitColor)
    : (isHexColor(safeColor) ? hexToRgba(safeColor, 0.12) : undefined);

  return {
    borderColor,
    boxShadow: `0 10px 18px rgba(0,0,0,.45), inset 0 1px 2px rgba(255,255,255,.18), 0 0 12px ${glow}`,
    backgroundColor,
    transform: `scale(${scale})`,
    transformOrigin: origin,
  };
}

function toGlowColor(color: string, alpha: number) {
  if (isHexColor(color)) return hexToRgba(color, alpha);
  return color;
}

function isHexColor(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function StatIcon({ kind }: { kind: 'atk' | 'def' }) {
  if (kind === 'def') {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4.5l5 5-9.5 9.5H5v-5l9.5-9.5z" />
      <path d="M12 7l5 5" />
      <path d="M4 20h6" />
    </svg>
  );
}
