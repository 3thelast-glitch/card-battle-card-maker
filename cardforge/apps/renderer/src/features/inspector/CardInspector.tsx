import { useMemo, useState, type ReactNode } from 'react';
import type {
  CardArt,
  CardRace,
  CardTrait,
  DataRow,
  ElementKey,
  Project,
} from '../../../../../packages/core/src/index';
import { getParentPath } from '@cardsmith/storage';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import {
  Palette,
  Image as ImageIcon,
  X,
  Eye,
  Layout,
  Wand2,
  Type,
  Shield,
  Zap,
  Sword,
  Crown,
  Pen,
  Sparkles,
  Copy,
  Trash2,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

import {
  CARD_TEMPLATES,
  type TemplateKey,
} from '../../templates/cardTemplates';
import type { Rarity } from '../../lib/balanceRules';
import { TemplatePicker } from '../templates/TemplatePicker';
import {
  TraitIcon,
  TRAIT_META,
  TRAIT_OPTIONS,
  type TraitKey,
} from '../../ui/icons/traitIcons';
import { ELEMENTS } from '../../lib/elements';
import { resolveImageSrc } from '../../utils/file';

// --- Constants ---
const RARITY_OPTIONS: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const RACE_OPTIONS: CardRace[] = [
  'human',
  'elf',
  'demon',
  'beast',
  'animal',
  'amphibian',
];

const RARITY_GRADIENT: Record<Rarity, string> = {
  common: 'from-slate-500 to-slate-600',
  rare: 'from-blue-500 to-cyan-500',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-400 to-orange-500',
};

// --- Type Definitions ---
interface BadgeModel {
  id: string;
  text?: string;
  color: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadowBlur: number;
  shadowColor: string;
  scale: number;
  rotation: number;
  opacity: number;
}

interface BadgeStylingPanelProps {
  badge: BadgeModel;
  onChange: (updates: Partial<BadgeModel>) => void;
}

const defaultBadgeStyle: Omit<BadgeModel, 'id'> = {
  text: '',
  color: 'rgba(15, 23, 42, 0.5)',
  textColor: '#f59e0b',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  borderRadius: 12,
  shadowBlur: 0,
  shadowColor: 'rgba(245, 158, 11, 0.5)',
  scale: 1,
  rotation: 0,
  opacity: 1,
};

// --- Shared primitive UI atoms ---

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-medium text-slate-500 mb-1.5 select-none">
      {children}
    </label>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full bg-[#12151E] border border-[#252A3A] text-slate-200 text-sm',
        'rounded-md px-2.5 py-1.5 placeholder-slate-600',
        'focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30',
        'hover:border-[#2E3550] transition-colors duration-150',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'w-full bg-[#12151E] border border-[#252A3A] text-slate-200 text-sm',
        'rounded-md px-2.5 py-1.5 pr-7 appearance-none cursor-pointer',
        'focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30',
        'hover:border-[#2E3550] transition-colors duration-150',
        props.className ?? '',
      ].join(' ')}
    />
  );
}

function GradientButton({
  onClick,
  children,
  className = '',
  variant = 'default',
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'magic' | 'danger' | 'ghost';
}) {
  const variants = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    magic:
      'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:brightness-110 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    ghost:
      'bg-white/[0.06] hover:bg-white/[0.10] text-slate-300 border border-white/[0.09] hover:border-white/[0.15]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
        'transition-colors duration-150 active:scale-[0.98]',
        variants[variant],
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// --- Section accordion shell ---
function Section({
  title,
  icon,
  accent = 'violet',
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: ReactNode;
  accent?: 'violet' | 'amber' | 'cyan' | 'rose' | 'emerald';
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Accent maps: icon+label color | active-bar color
  const iconColors: Record<string, string> = {
    violet: 'text-violet-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
    emerald: 'text-emerald-400',
  };
  const barColors: Record<string, string> = {
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
  };
  return (
    /* Flat Figma-panel section: bottom border separator, no heavy box */
    <div className="border-b border-[#1A1F2E] last:border-b-0">
      {/* Section heading row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors duration-150 group"
      >
        <span className={`flex-shrink-0 ${iconColors[accent]}`}>{icon}</span>
        <span className="flex-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <span
          className={`text-slate-600 group-hover:text-slate-400 transition-colors text-[10px] ${open ? 'rotate-180' : ''} inline-block`}
        >
          ▾
        </span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// --- Child Components ---

const BadgeStylingPanel = ({ badge, onChange }: BadgeStylingPanelProps) => {
  const [activeTab, setActiveTab] = useState<
    'layout' | 'colors' | 'effects' | 'content'
  >('layout');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  const tabs = {
    layout: { label: 'التخطيط', icon: Layout },
    colors: { label: 'الألوان', icon: Palette },
    effects: { label: 'التأثيرات', icon: Wand2 },
    content: { label: 'المحتوى', icon: Pen },
  };

  const ControlWrapper = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-col gap-4">{children}</div>
  );

  const ControlRow = ({
    label,
    children,
  }: {
    label: string;
    children: ReactNode;
  }) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );

  const GameSlider = ({
    value,
    min,
    max,
    step,
    onChange: onSliderChange,
  }: {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
  }) => (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onSliderChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
    />
  );

  const ColorButton = ({
    color,
    field,
  }: {
    color: string;
    field: keyof BadgeModel;
  }) => (
    <button
      type="button"
      onClick={() =>
        setShowColorPicker(showColorPicker === field ? null : field)
      }
      className="w-full h-9 rounded-lg border-2 border-slate-600 hover:border-slate-400 transition-colors duration-200 shadow-inner"
      style={{ backgroundColor: color }}
    />
  );

  return (
    <div
      dir="rtl"
      className="w-full rounded-xl border border-white/[0.08] overflow-hidden bg-black/20"
    >
      {/* Tab bar */}
      <div className="flex bg-white/[0.04] border-b border-white/[0.07]">
        {Object.entries(tabs).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as any)}
            className={[
              'relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[11px] font-semibold transition-all duration-200',
              activeTab === key
                ? 'text-indigo-300 bg-indigo-500/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]',
            ].join(' ')}
          >
            <Icon size={12} />
            <span>{label}</span>
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-5">
        {activeTab === 'layout' && (
          <ControlWrapper>
            <ControlRow label="الحجم (Scale)">
              <GameSlider
                value={badge.scale}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => onChange({ scale: v })}
              />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">
                {badge.scale.toFixed(2)}x
              </span>
            </ControlRow>
            <ControlRow label="الدوران (Rotation)">
              <GameSlider
                value={badge.rotation}
                min={-180}
                max={180}
                step={1}
                onChange={(v) => onChange({ rotation: v })}
              />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">
                {badge.rotation}°
              </span>
            </ControlRow>
          </ControlWrapper>
        )}

        {activeTab === 'colors' && (
          <ControlWrapper>
            <ControlRow label="لون الخلفية">
              <ColorButton color={badge.color} field="color" />
            </ControlRow>
            {showColorPicker === 'color' && (
              <HexColorPicker
                color={badge.color}
                onChange={(c) => onChange({ color: c })}
              />
            )}
            <ControlRow label="لون النص">
              <ColorButton color={badge.textColor} field="textColor" />
            </ControlRow>
            {showColorPicker === 'textColor' && (
              <HexColorPicker
                color={badge.textColor}
                onChange={(c) => onChange({ textColor: c })}
              />
            )}
            <ControlRow label="الشفافية (Opacity)">
              <GameSlider
                value={badge.opacity}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onChange({ opacity: v })}
              />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">
                %{Math.round(badge.opacity * 100)}
              </span>
            </ControlRow>
          </ControlWrapper>
        )}

        {activeTab === 'effects' && (
          <ControlWrapper>
            <ControlRow label="عرض الإطار">
              <GameSlider
                value={badge.borderWidth}
                min={0}
                max={10}
                step={0.5}
                onChange={(v) => onChange({ borderWidth: v })}
              />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">
                {badge.borderWidth}px
              </span>
            </ControlRow>
            <ControlRow label="لون الإطار">
              <ColorButton color={badge.borderColor} field="borderColor" />
            </ControlRow>
            {showColorPicker === 'borderColor' && (
              <HexColorPicker
                color={badge.borderColor}
                onChange={(c) => onChange({ borderColor: c })}
              />
            )}
            <ControlRow label="تدوير الحواف">
              <GameSlider
                value={badge.borderRadius}
                min={0}
                max={32}
                step={1}
                onChange={(v) => onChange({ borderRadius: v })}
              />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">
                {badge.borderRadius}px
              </span>
            </ControlRow>
            <ControlRow label="قوة التوهج (Shadow)">
              <GameSlider
                value={badge.shadowBlur}
                min={0}
                max={30}
                step={1}
                onChange={(v) => onChange({ shadowBlur: v })}
              />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">
                {badge.shadowBlur}px
              </span>
            </ControlRow>
            <ControlRow label="لون التوهج">
              <ColorButton color={badge.shadowColor} field="shadowColor" />
            </ControlRow>
            {showColorPicker === 'shadowColor' && (
              <HexColorPicker
                color={badge.shadowColor}
                onChange={(c) => onChange({ shadowColor: c })}
              />
            )}
          </ControlWrapper>
        )}

        {activeTab === 'content' && (
          <ControlWrapper>
            <ControlRow label="النص">
              <StyledInput
                value={badge.text ?? ''}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder="أدخل النص هنا..."
              />
            </ControlRow>
          </ControlWrapper>
        )}
      </div>
    </div>
  );
};

const TraitPicker = ({
  selectedTraits = [],
  onAddTrait,
  onRemoveTrait,
  maxTraits = 5,
}: {
  selectedTraits: TraitKey[];
  onAddTrait: (trait: TraitKey) => void;
  onRemoveTrait: (trait: TraitKey) => void;
  maxTraits?: number;
}) => {
  const availableOptions = TRAIT_OPTIONS.filter(
    (option) => !selectedTraits.includes(option.value),
  );

  return (
    <div className="space-y-3">
      {selectedTraits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Active Traits</FieldLabel>
            <span className="text-[10px] font-mono text-slate-500 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-full">
              {selectedTraits.length}/{maxTraits}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTraits.map((trait) => (
              <button
                key={trait}
                type="button"
                onClick={() => onRemoveTrait(trait)}
                className="relative group w-9 h-9 rounded-lg ring-2 ring-indigo-500/50 ring-offset-1 ring-offset-black/50 hover:ring-rose-500/60 transition-all flex items-center justify-center bg-white/[0.07]"
                title={`Remove ${trait}`}
              >
                <TraitIcon trait={trait} size={18} />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <X size={8} className="text-white" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <FieldLabel>Add Trait</FieldLabel>
        <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-2 bg-black/20 rounded-lg border border-white/[0.07]">
          {availableOptions.slice(0, 18).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (selectedTraits.length < maxTraits) onAddTrait(option.value);
              }}
              className="w-full aspect-square rounded-lg flex items-center justify-center bg-white/[0.05] hover:bg-indigo-500/20 hover:scale-110 transition-all duration-150 border border-white/[0.07] hover:border-indigo-500/40"
              title={option.label}
            >
              <TraitIcon trait={option.value} size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export function CardInspector(props: {
  cardData: DataRow | null;
  project: Project;
  language: 'en' | 'ar';
  columns?: string[];
  onChange: (newCardData: DataRow) => void;
  onPickImage: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const {
    cardData,
    project,
    language,
    onChange,
    onPickImage,
    onDuplicate,
    onDelete,
  } = props;

  const data = cardData?.data ?? {};
  const art: CardArt | undefined = cardData?.art ?? (data as any).art;
  const rarity = normalizeRarity(data.rarity);
  const templateKey = normalizeTemplateKey(data.templateKey ?? data.template);
  const race = normalizeRace(data.race);
  const element = normalizeElement(data.element);
  const traits = normalizeTraits(data.traits ?? (data as any).trait);
  const attack = normalizeNumber(data.attack ?? data.stats?.attack);
  const defense = normalizeNumber(data.defense ?? data.stats?.defense);
  const cost = data.cost != null ? normalizeNumber(data.cost) : '';
  const nameEn = getLocalizedValue(data.name ?? data.title, 'en');
  const nameAr = getLocalizedValue(data.name ?? data.title, 'ar');
  const descriptionEn = getLocalizedValue(data.desc, 'en');
  const descriptionAr = getLocalizedValue(data.desc, 'ar');
  const abilityEn = getLocalizedValue(data.ability, 'en');
  const abilityAr = getLocalizedValue(data.ability, 'ar');

  const badgeStyles = (data as any)?.style?.badges ?? {};

  const traitSet = new Set(traits);

  const assetOptions = useMemo(
    () =>
      (project?.assets?.images ?? []).map((asset) => ({
        id: asset.id,
        name: asset.name,
        src: asset.src,
        resolvedSrc: resolveImageSrc(
          asset.src,
          project?.meta?.filePath
            ? getParentPath(project.meta.filePath)
            : undefined,
        ),
      })),
    [project],
  );

  const handleUpdateData = (path: string, value: any) => {
    if (!cardData) return;
    onChange({
      ...cardData,
      data: setPathValue(cardData.data ?? {}, path, value),
    });
  };

  const addTrait = (trait: TraitKey) => {
    if (traitSet.has(trait)) return;
    handleUpdateData('traits', [...traits, trait]);
  };

  const removeTrait = (trait: TraitKey) => {
    handleUpdateData(
      'traits',
      traits.filter((t) => t !== trait),
    );
  };

  const handleUpdateStat = (key: 'attack' | 'defense', value: number) => {
    if (!cardData) return;
    const data = cardData.data ?? {};
    const stats = { ...(data.stats ?? {}), [key]: value };
    onChange({
      ...cardData,
      data: {
        ...data,
        [key]: value,
        stats,
      },
    });
  };

  const [selectedBadgeId, setSelectedBadgeId] = useState<
    'attackBadge' | 'defenseBadge' | 'elementBadge' | 'tribe'
  >('attackBadge');

  const selectedBadgeStyle: BadgeModel = {
    ...defaultBadgeStyle,
    id: selectedBadgeId,
    ...(badgeStyles[selectedBadgeId] ?? {}),
  };

  const handleBadgeChange = (updates: Partial<BadgeModel>) => {
    const newBadgeStyles = {
      ...badgeStyles,
      [selectedBadgeId]: {
        ...selectedBadgeStyle,
        ...updates,
      },
    };

    if (!cardData) return;
    onChange({
      ...cardData,
      data: {
        ...cardData.data,
        style: {
          ...(((cardData.data as any).style as object) || {}),
          badges: newBadgeStyles,
        },
      },
    });
  };

  if (!cardData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#12151E] border border-[#1E2435] flex items-center justify-center">
          <ImageIcon size={20} className="text-slate-600" />
        </div>
        <p className="text-sm font-medium text-slate-500">{t('cards.empty')}</p>
        <p className="text-xs text-slate-700 leading-relaxed">
          Select a card from the list to inspect it
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-slate-200">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#1A1F2E] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Inspector
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate card"
            className="w-6 h-6 rounded-md bg-white/[0.04] hover:bg-white/[0.09] text-slate-500 hover:text-slate-300 flex items-center justify-center transition-colors duration-150"
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete card"
            className="w-6 h-6 rounded-md bg-rose-500/[0.08] hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 flex items-center justify-center transition-colors duration-150"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1A1F2E]">
        {/* ── Card Identity ── */}
        <Section
          title={t('editor.inspector.card')}
          icon={<Type size={13} />}
          accent="violet"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>{t('common.name')} (EN)</FieldLabel>
              <StyledInput
                value={nameEn}
                onChange={(e) => handleUpdateData('name.en', e.target.value)}
                placeholder="Card name…"
              />
            </div>
            <div>
              <FieldLabel>{t('common.name')} (AR)</FieldLabel>
              <StyledInput
                value={nameAr}
                onChange={(e) => handleUpdateData('name.ar', e.target.value)}
                placeholder="اسم البطاقة…"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>{t('data.cost')}</FieldLabel>
              <StyledInput
                type="number"
                value={cost}
                onChange={(e) =>
                  handleUpdateData('cost', Number(e.target.value) || 0)
                }
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <FieldLabel>
                {t('cards.meta.type', { defaultValue: 'Element' })}
              </FieldLabel>
              <StyledSelect
                value={element}
                onChange={(e) =>
                  handleUpdateData('element', e.target.value || undefined)
                }
              >
                <option value="">{t('common.none')}</option>
                {Object.keys(ELEMENTS).map((key) => (
                  <option key={key} value={key}>
                    {t(`elements.${key}`, { defaultValue: key })}
                  </option>
                ))}
              </StyledSelect>
            </div>
          </div>

          <div>
            <FieldLabel>{t('cards.meta.race')}</FieldLabel>
            <StyledSelect
              value={race}
              onChange={(e) =>
                handleUpdateData('race', e.target.value || undefined)
              }
            >
              <option value="">{t('common.none')}</option>
              {RACE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`races.${option}`)}
                </option>
              ))}
            </StyledSelect>
          </div>

          <div>
            <FieldLabel>
              {t('cards.meta.class', { defaultValue: 'Traits / Class' })}
            </FieldLabel>
            <TraitPicker
              selectedTraits={traits as TraitKey[]}
              onAddTrait={addTrait}
              onRemoveTrait={removeTrait}
            />
          </div>
        </Section>

        {/* ── Stats ── */}
        <Section
          title={t('editor.inspector.stats')}
          icon={<Zap size={13} />}
          accent="amber"
        >
          {/* Stat orbs */}
          <div className="grid grid-cols-2 gap-3">
            {/* ATK */}
            <div className="bg-rose-500/[0.07] border border-rose-500/20 rounded-xl p-3">
              <FieldLabel>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <Sword size={10} />
                  {t('editor.inspector.attack')}
                </span>
              </FieldLabel>
              <StyledInput
                type="number"
                value={attack}
                onChange={(e) =>
                  handleUpdateStat('attack', Number(e.target.value) || 0)
                }
                className="text-center font-mono text-xl font-bold text-rose-300 bg-transparent border-rose-500/30 focus:border-rose-400"
              />
              <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (attack / 20) * 100)}%` }}
                />
              </div>
            </div>
            {/* DEF */}
            <div className="bg-sky-500/[0.07] border border-sky-500/20 rounded-xl p-3">
              <FieldLabel>
                <span className="flex items-center gap-1.5 text-sky-400">
                  <Shield size={10} />
                  {t('editor.inspector.defense')}
                </span>
              </FieldLabel>
              <StyledInput
                type="number"
                value={defense}
                onChange={(e) =>
                  handleUpdateStat('defense', Number(e.target.value) || 0)
                }
                className="text-center font-mono text-xl font-bold text-sky-300 bg-transparent border-sky-500/30 focus:border-sky-400"
              />
              <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (defense / 20) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Text / Lore ── */}
        <Section
          title={t('editor.inspector.text')}
          icon={<Type size={13} />}
          accent="cyan"
        >
          <div className="space-y-3">
            <div>
              <FieldLabel>{t('common.description')} (EN)</FieldLabel>
              <StyledInput
                value={descriptionEn}
                onChange={(e) => handleUpdateData('desc.en', e.target.value)}
                placeholder="Card description…"
              />
            </div>
            <div>
              <FieldLabel>{t('common.description')} (AR)</FieldLabel>
              <StyledInput
                value={descriptionAr}
                onChange={(e) => handleUpdateData('desc.ar', e.target.value)}
                placeholder="وصف البطاقة…"
                dir="rtl"
              />
            </div>
            <div>
              <FieldLabel>
                {t('editor.inspector.ability', { defaultValue: 'Ability' })}{' '}
                (EN)
              </FieldLabel>
              <StyledInput
                value={abilityEn}
                onChange={(e) => handleUpdateData('ability.en', e.target.value)}
                placeholder="Ability text…"
              />
            </div>
            <div>
              <FieldLabel>
                {t('editor.inspector.ability', { defaultValue: 'Ability' })}{' '}
                (AR)
              </FieldLabel>
              <StyledInput
                value={abilityAr}
                onChange={(e) => handleUpdateData('ability.ar', e.target.value)}
                placeholder="نص الموهبة…"
                dir="rtl"
              />
            </div>
          </div>
        </Section>

        {/* ── Visuals ── */}
        <Section
          title={t('editor.inspector.visuals', { defaultValue: 'Visuals' })}
          icon={<ImageIcon size={13} />}
          accent="emerald"
        >
          {/* Template */}
          <div>
            <FieldLabel>{t('editor.inspector.template')}</FieldLabel>
            <TemplatePicker
              value={templateKey}
              language={language}
              onChange={(next) => handleUpdateData('templateKey', next)}
            />
          </div>

          {/* Rarity */}
          <div>
            <FieldLabel>{t('editor.inspector.rarity')}</FieldLabel>
            <div className="grid grid-cols-4 gap-1.5">
              {RARITY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleUpdateData('rarity', option)}
                  className={[
                    'py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200',
                    rarity === option
                      ? `bg-gradient-to-b ${RARITY_GRADIENT[option]} text-white shadow-lg shadow-black/40 scale-105 border border-white/20`
                      : 'bg-white/[0.05] text-slate-500 hover:bg-white/[0.09] hover:text-slate-300 border border-white/[0.07]',
                  ].join(' ')}
                >
                  {getRarityLabel(option, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Artwork */}
          <div>
            <FieldLabel>{t('data.uploadImage')}</FieldLabel>
            <div className="flex items-center gap-2">
              <GradientButton
                onClick={onPickImage}
                variant="default"
                className="flex-1"
              >
                <UploadCloud size={14} />
                {t('data.uploadImage')}
              </GradientButton>
              <GradientButton
                variant="magic"
                onClick={() => {
                  console.log('[Vibe Sync] AI magic triggered ✨');
                }}
                className="flex-shrink-0"
              >
                <Sparkles size={13} />
                Vibe Sync ✨
              </GradientButton>
            </div>

            {/* Art status pill */}
            <div
              className={[
                'mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
                art?.kind === 'image'
                  ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                  : art?.kind === 'video'
                    ? 'bg-blue-900/40 text-blue-400 border border-blue-700/40'
                    : 'bg-slate-800/60 text-slate-500 border border-slate-700/40',
              ].join(' ')}
            >
              {art?.kind === 'image' ? (
                <CheckCircle2 size={12} />
              ) : art?.kind === 'video' ? (
                <Eye size={12} />
              ) : (
                <ImageIcon size={12} />
              )}
              {art?.kind === 'video'
                ? t('data.videoUsesPoster')
                : art?.kind === 'image'
                  ? t('data.imageSelected')
                  : t('data.noArtwork')}
            </div>
          </div>

          {/* Asset grid */}
          {assetOptions.length > 0 && (
            <div>
              <FieldLabel>
                {t('assets.title', { defaultValue: 'Project Assets' })}
              </FieldLabel>
              <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-0.5">
                {assetOptions.map((asset) => {
                  const isSelected =
                    art?.kind === 'image' &&
                    (art.src === asset.resolvedSrc || art.src === asset.src);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        if (cardData)
                          onChange({
                            ...cardData,
                            art: { kind: 'image', src: asset.resolvedSrc },
                          });
                      }}
                      className={[
                        'group relative rounded-lg overflow-hidden border-2 transition-all duration-200 aspect-square',
                        isSelected
                          ? 'border-violet-500 shadow-lg shadow-violet-900/50 scale-95'
                          : 'border-slate-700 hover:border-slate-500 hover:scale-105',
                      ].join(' ')}
                    >
                      <div
                        className="w-full h-full bg-center bg-cover"
                        style={{
                          backgroundImage: `url("${asset.resolvedSrc}")`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] text-white font-bold truncate">
                          {asset.name}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        {/* ── Badge Designer ── */}
        <Section
          title="Badge Designer"
          icon={<Palette size={13} />}
          accent="rose"
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div>
              <FieldLabel>Badge Target</FieldLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'attackBadge', label: 'Attack', icon: Sword },
                    { id: 'defenseBadge', label: 'Defense', icon: Shield },
                    { id: 'elementBadge', label: 'Element', icon: Zap },
                    { id: 'tribe', label: 'Tribe', icon: Crown },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedBadgeId(id)}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border',
                      selectedBadgeId === id
                        ? 'bg-rose-600 text-white shadow-md border-rose-500/60'
                        : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.09] hover:text-slate-200 border-white/[0.08]',
                    ].join(' ')}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <BadgeStylingPanel
              badge={selectedBadgeStyle}
              onChange={handleBadgeChange}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

// --- Helper Functions ---
function setPathValue(data: Record<string, any>, path: string, value: any) {
  if (!path.includes('.')) {
    return { ...data, [path]: value };
  }
  const result: Record<string, any> = { ...data };
  const parts = path.split('.');
  let cursor: Record<string, any> = result;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const next = cursor[part];
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      cursor[part] = { ...next };
    } else {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
  return result;
}

function getLocalizedValue(value: any, language: 'en' | 'ar') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return String(value[language] ?? value.en ?? value.ar ?? '');
  }
  return value == null ? '' : String(value);
}

function normalizeTemplateKey(value: any): TemplateKey {
  const cleaned = String(value || '')
    .toLowerCase()
    .trim();
  if (
    cleaned &&
    Object.prototype.hasOwnProperty.call(CARD_TEMPLATES, cleaned)
  ) {
    return cleaned as TemplateKey;
  }
  return 'classic';
}

function normalizeRarity(value: any): Rarity {
  const cleaned = String(value || '')
    .toLowerCase()
    .trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary')
    return cleaned as Rarity;
  return 'common';
}

function normalizeRace(value: any): CardRace {
  const cleaned = String(value || '')
    .toLowerCase()
    .trim();
  return cleaned as CardRace;
}

function normalizeElement(value: any): ElementKey {
  const cleaned = String(value || '')
    .toLowerCase()
    .trim();
  return cleaned as ElementKey;
}

function normalizeTraits(value: any): CardTrait[] {
  if (Array.isArray(value)) {
    return value
      .map((trait) => String(trait).toLowerCase().trim())
      .filter(Boolean) as CardTrait[];
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(/[,|]/g)
    .map((trait) => trait.trim().toLowerCase())
    .filter(Boolean) as CardTrait[];
}

function normalizeNumber(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRarityLabel(rarity: Rarity, language: 'en' | 'ar'): string {
  const labels = {
    common: { en: 'Common', ar: 'عادي' },
    rare: { en: 'Rare', ar: 'نادر' },
    epic: { en: 'Epic', ar: 'ملحمي' },
    legendary: { en: 'Legendary', ar: 'أسطوري' },
  } as const;
  return labels[rarity][language] ?? labels[rarity].en;
}
