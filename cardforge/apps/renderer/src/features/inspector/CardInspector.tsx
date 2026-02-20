﻿import { useMemo, useState, useCallback, ReactNode } from 'react';
import type { CardArt, CardRace, CardTrait, DataRow, ElementKey, Project } from '../../../../../packages/core/src/index';
import { getParentPath } from '@cardsmith/storage';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import {
  Palette, Maximize, Image as ImageIcon, X, RotateCcw, MoveHorizontal, Square, Move,
  Layout, Wand2, Type, Eye, EyeOff, Layers, Shield, Zap, Star, Heart, Sword, Flame, Moon,
  Droplets, Diamond, Mic, Skull, Ghost, Anchor, Sun, Crown, ArrowRight, Circle, Pen,
  Sparkles, Copy, Trash2, UploadCloud, CheckCircle2,
} from 'lucide-react';
import { Button, Input, Row, Select } from '../../components/ui';
import { CARD_TEMPLATES, type TemplateKey } from '../../templates/cardTemplates';
import type { Rarity } from '../../lib/balanceRules';
import { TemplatePicker } from '../templates/TemplatePicker';
import { TraitIcon, TRAIT_META, TRAIT_OPTIONS, type TraitKey } from '../../ui/icons/traitIcons';
import { ELEMENTS } from '../../lib/elements';
import { resolveImageSrc } from '../../utils/file';

// --- Constants ---
const RARITY_OPTIONS: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const RACE_OPTIONS: CardRace[] = ['human', 'elf', 'demon', 'beast', 'animal', 'amphibian'];

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
    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
      {children}
    </label>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full bg-slate-800/80 border border-slate-700/80 text-slate-100 text-sm',
        'rounded-lg px-3 py-2 placeholder-slate-600',
        'focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30',
        'transition-all duration-200',
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
        'w-full bg-slate-800/80 border border-slate-700/80 text-slate-100 text-sm',
        'rounded-lg px-3 py-2 appearance-none cursor-pointer',
        'focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30',
        'transition-all duration-200',
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
    default: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/40',
    magic: 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:via-orange-400 hover:to-pink-400 text-white shadow-lg shadow-orange-900/40',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-900/40',
    ghost: 'bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700 hover:border-slate-600',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold tracking-wide',
        'transition-all duration-200 active:scale-95',
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
  const accents: Record<string, string> = {
    violet: 'from-violet-500/20 to-transparent border-violet-500/30 text-violet-400',
    amber: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-400',
    cyan: 'from-cyan-500/20 to-transparent border-cyan-500/30 text-cyan-400',
    rose: 'from-rose-500/20 to-transparent border-rose-500/30 text-rose-400',
    emerald: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-400',
  };
  return (
    <div className="rounded-xl border border-slate-700/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r ${accents[accent]} border-b text-left transition-all duration-200 hover:brightness-110`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="flex-1 text-xs font-bold uppercase tracking-widest">{title}</span>
        <span className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-4 py-4 bg-slate-900/60 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// --- Child Components ---

const BadgeStylingPanel = ({ badge, onChange }: BadgeStylingPanelProps) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'colors' | 'effects' | 'content'>('layout');
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

  const ControlRow = ({ label, children }: { label: string; children: ReactNode }) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );

  const GameSlider = ({ value, min, max, step, onChange: onSliderChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) => (
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

  const ColorButton = ({ color, field }: { color: string; field: keyof BadgeModel }) => (
    <button
      type="button"
      onClick={() => setShowColorPicker(showColorPicker === field ? null : field)}
      className="w-full h-9 rounded-lg border-2 border-slate-600 hover:border-slate-400 transition-colors duration-200 shadow-inner"
      style={{ backgroundColor: color }}
    />
  );

  return (
    <div dir="rtl" className="w-full rounded-xl border border-slate-700/60 overflow-hidden bg-slate-900/60">
      {/* Tab bar */}
      <div className="flex bg-slate-800/80 border-b border-slate-700/60">
        {Object.entries(tabs).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as any)}
            className={[
              'relative flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-bold transition-all duration-200',
              activeTab === key
                ? 'text-amber-400 bg-slate-900/70'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800',
            ].join(' ')}
          >
            <Icon size={13} />
            <span>{label}</span>
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-5">
        {activeTab === 'layout' && (
          <ControlWrapper>
            <ControlRow label="الحجم (Scale)">
              <GameSlider value={badge.scale} min={0.5} max={2} step={0.05} onChange={(v) => onChange({ scale: v })} />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">{badge.scale.toFixed(2)}x</span>
            </ControlRow>
            <ControlRow label="الدوران (Rotation)">
              <GameSlider value={badge.rotation} min={-180} max={180} step={1} onChange={(v) => onChange({ rotation: v })} />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">{badge.rotation}°</span>
            </ControlRow>
          </ControlWrapper>
        )}

        {activeTab === 'colors' && (
          <ControlWrapper>
            <ControlRow label="لون الخلفية">
              <ColorButton color={badge.color} field="color" />
            </ControlRow>
            {showColorPicker === 'color' && (
              <HexColorPicker color={badge.color} onChange={(c) => onChange({ color: c })} />
            )}
            <ControlRow label="لون النص">
              <ColorButton color={badge.textColor} field="textColor" />
            </ControlRow>
            {showColorPicker === 'textColor' && (
              <HexColorPicker color={badge.textColor} onChange={(c) => onChange({ textColor: c })} />
            )}
            <ControlRow label="الشفافية (Opacity)">
              <GameSlider value={badge.opacity} min={0} max={1} step={0.05} onChange={(v) => onChange({ opacity: v })} />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">%{Math.round(badge.opacity * 100)}</span>
            </ControlRow>
          </ControlWrapper>
        )}

        {activeTab === 'effects' && (
          <ControlWrapper>
            <ControlRow label="عرض الإطار">
              <GameSlider value={badge.borderWidth} min={0} max={10} step={0.5} onChange={(v) => onChange({ borderWidth: v })} />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">{badge.borderWidth}px</span>
            </ControlRow>
            <ControlRow label="لون الإطار">
              <ColorButton color={badge.borderColor} field="borderColor" />
            </ControlRow>
            {showColorPicker === 'borderColor' && (
              <HexColorPicker color={badge.borderColor} onChange={(c) => onChange({ borderColor: c })} />
            )}
            <ControlRow label="تدوير الحواف">
              <GameSlider value={badge.borderRadius} min={0} max={32} step={1} onChange={(v) => onChange({ borderRadius: v })} />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">{badge.borderRadius}px</span>
            </ControlRow>
            <ControlRow label="قوة التوهج (Shadow)">
              <GameSlider value={badge.shadowBlur} min={0} max={30} step={1} onChange={(v) => onChange({ shadowBlur: v })} />
              <span className="text-slate-300 text-xs w-12 text-center font-mono">{badge.shadowBlur}px</span>
            </ControlRow>
            <ControlRow label="لون التوهج">
              <ColorButton color={badge.shadowColor} field="shadowColor" />
            </ControlRow>
            {showColorPicker === 'shadowColor' && (
              <HexColorPicker color={badge.shadowColor} onChange={(c) => onChange({ shadowColor: c })} />
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
  const availableTraits = TRAIT_OPTIONS.filter((trait) => !selectedTraits.includes(trait));

  return (
    <div className="space-y-3">
      {selectedTraits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Active Traits</FieldLabel>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {selectedTraits.length}/{maxTraits}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTraits.map((trait) => (
              <div key={trait} className="relative group">
                <TraitIcon
                  trait={trait}
                  selected={true}
                  onClick={() => onRemoveTrait(trait)}
                  className="w-9 h-9 ring-2 ring-violet-500/60 ring-offset-1 ring-offset-slate-900"
                />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <X size={8} className="text-white" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <FieldLabel>Add Trait</FieldLabel>
        <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-800/60 rounded-lg border border-slate-700/60">
          {availableTraits.slice(0, 18).map((trait) => (
            <TraitIcon
              key={trait}
              trait={trait}
              onClick={() => {
                if (selectedTraits.length < maxTraits) onAddTrait(trait);
              }}
              className="w-10 h-10 hover:scale-110 transition-transform duration-150"
            />
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
  onChange: (newCardData: DataRow) => void;
  onPickImage: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { cardData, project, language, onChange, onPickImage, onDuplicate, onDelete } = props;

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
          project?.meta?.filePath ? getParentPath(project.meta.filePath) : undefined,
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
    handleUpdateData('traits', traits.filter((t) => t !== trait));
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

  const [selectedBadgeId, setSelectedBadgeId] = useState<'attackBadge' | 'defenseBadge' | 'elementBadge' | 'tribe'>('attackBadge');

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
          ...(cardData.data as Record<string, unknown>).style,
          badges: newBadgeStyles,
        },
      },
    });
  };

  if (!cardData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
          <ImageIcon size={22} className="text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-500">{t('cards.empty')}</p>
        <p className="text-xs text-slate-600">Select a card from the list to inspect it</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-slate-100 bg-slate-900">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Layers size={12} className="text-white" />
          </div>
          <h3 className="font-bold text-slate-100 uppercase tracking-tighter text-sm">Inspector</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate"
            className="w-7 h-7 rounded-lg bg-slate-700/60 hover:bg-slate-600 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all duration-150"
          >
            <Copy size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="w-7 h-7 rounded-lg bg-rose-900/30 hover:bg-rose-700/50 text-rose-400 hover:text-rose-200 flex items-center justify-center transition-all duration-150"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">

        {/* ── Card Identity ── */}
        <Section title={t('editor.inspector.card')} icon={<Type size={13} />} accent="violet">
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
                onChange={(e) => handleUpdateData('cost', Number(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <FieldLabel>{t('cards.meta.type', { defaultValue: 'Element' })}</FieldLabel>
              <StyledSelect
                value={element}
                onChange={(e) => handleUpdateData('element', e.target.value || undefined)}
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
              onChange={(e) => handleUpdateData('race', e.target.value || undefined)}
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
            <FieldLabel>{t('cards.meta.class', { defaultValue: 'Traits / Class' })}</FieldLabel>
            <TraitPicker
              selectedTraits={traits as TraitKey[]}
              onAddTrait={addTrait}
              onRemoveTrait={removeTrait}
            />
          </div>
        </Section>

        {/* ── Stats ── */}
        <Section title={t('editor.inspector.stats')} icon={<Zap size={13} />} accent="amber">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>
                <span className="flex items-center gap-1.5">
                  <Sword size={10} className="text-rose-400" />
                  {t('editor.inspector.attack')}
                </span>
              </FieldLabel>
              <StyledInput
                type="number"
                value={attack}
                onChange={(e) => handleUpdateStat('attack', Number(e.target.value) || 0)}
                className="text-center font-mono text-lg font-bold text-rose-300"
              />
            </div>
            <div>
              <FieldLabel>
                <span className="flex items-center gap-1.5">
                  <Shield size={10} className="text-sky-400" />
                  {t('editor.inspector.defense')}
                </span>
              </FieldLabel>
              <StyledInput
                type="number"
                value={defense}
                onChange={(e) => handleUpdateStat('defense', Number(e.target.value) || 0)}
                className="text-center font-mono text-lg font-bold text-sky-300"
              />
            </div>
          </div>
          {/* Mini stat preview bar */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase">ATK {attack}</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (attack / 20) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase">DEF {defense}</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (defense / 20) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Text / Lore ── */}
        <Section title={t('editor.inspector.text')} icon={<Type size={13} />} accent="cyan">
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
              <FieldLabel>{t('editor.inspector.ability', { defaultValue: 'Ability' })} (EN)</FieldLabel>
              <StyledInput
                value={abilityEn}
                onChange={(e) => handleUpdateData('ability.en', e.target.value)}
                placeholder="Ability text…"
              />
            </div>
            <div>
              <FieldLabel>{t('editor.inspector.ability', { defaultValue: 'Ability' })} (AR)</FieldLabel>
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
        <Section title={t('editor.inspector.visuals', { defaultValue: 'Visuals' })} icon={<ImageIcon size={13} />} accent="emerald">
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
                    'py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200',
                    rarity === option
                      ? `bg-gradient-to-b ${RARITY_GRADIENT[option]} text-white shadow-lg scale-105`
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300 border border-slate-700',
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
              <GradientButton onClick={onPickImage} variant="ghost" className="flex-1">
                <UploadCloud size={14} />
                {t('data.uploadImage')}
              </GradientButton>
              <GradientButton
                variant="magic"
                onClick={() => { console.log('[Vibe Sync] AI magic triggered ✨'); }}
                className="flex-shrink-0"
              >
                <Sparkles size={13} />
                Vibe Sync ✨
              </GradientButton>
            </div>

            {/* Art status pill */}
            <div className={[
              'mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              art?.kind === 'image' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' :
                art?.kind === 'video' ? 'bg-blue-900/40 text-blue-400 border border-blue-700/40' :
                  'bg-slate-800/60 text-slate-500 border border-slate-700/40',
            ].join(' ')}>
              {art?.kind === 'image' ? <CheckCircle2 size={12} /> :
                art?.kind === 'video' ? <Eye size={12} /> :
                  <ImageIcon size={12} />}
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
              <FieldLabel>{t('assets.title', { defaultValue: 'Project Assets' })}</FieldLabel>
              <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-0.5">
                {assetOptions.map((asset) => {
                  const isSelected =
                    art?.kind === 'image' && (art.src === asset.resolvedSrc || art.src === asset.src);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        if (cardData) onChange({ ...cardData, art: { kind: 'image', src: asset.resolvedSrc } });
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
                        style={{ backgroundImage: `url("${asset.resolvedSrc}")` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] text-white font-bold truncate">{asset.name}</p>
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
        <Section title="Badge Designer" icon={<Palette size={13} />} accent="rose" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <FieldLabel>Badge Target</FieldLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { id: 'attackBadge', label: 'Attack', icon: Sword },
                  { id: 'defenseBadge', label: 'Defense', icon: Shield },
                  { id: 'elementBadge', label: 'Element', icon: Zap },
                  { id: 'tribe', label: 'Tribe', icon: Crown },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedBadgeId(id)}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200',
                      selectedBadgeId === id
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700',
                    ].join(' ')}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <BadgeStylingPanel badge={selectedBadgeStyle} onChange={handleBadgeChange} />
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
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned && Object.prototype.hasOwnProperty.call(CARD_TEMPLATES, cleaned)) {
    return cleaned as TemplateKey;
  }
  return 'classic';
}

function normalizeRarity(value: any): Rarity {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned as Rarity;
  return 'common';
}

function normalizeRace(value: any): CardRace {
  const cleaned = String(value || '').toLowerCase().trim();
  return cleaned as CardRace;
}

function normalizeElement(value: any): ElementKey {
  const cleaned = String(value || '').toLowerCase().trim();
  return cleaned as ElementKey;
}

function normalizeTraits(value: any): CardTrait[] {
  if (Array.isArray(value)) {
    return value.map((trait) => String(trait).toLowerCase().trim()).filter(Boolean) as CardTrait[];
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