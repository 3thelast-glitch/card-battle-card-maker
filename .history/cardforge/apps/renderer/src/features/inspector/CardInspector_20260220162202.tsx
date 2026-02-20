﻿import { useMemo, useState, useCallback, ReactNode } from 'react';
import type { CardArt, CardRace, CardTrait, DataRow, ElementKey, Project } from '../../../../../packages/core/src/index';
import { getParentPath } from '@cardsmith/storage';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import { 
  Palette, Maximize, Image as ImageIcon, X, RotateCcw, MoveHorizontal, Square, Move, 
  Layout, Wand2, Type, Eye, EyeOff, Layers, Shield, Zap, Star, Heart, Sword, Flame, Moon, 
  Droplets, Diamond, Mic, Skull, Ghost, Anchor, Sun, Crown, ArrowRight, Circle, Pen
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
      <label className="block text-sm font-medium text-neutral-400 mb-2">{label}</label>
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
      className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
    />
  );
  
  const ColorButton = ({ color, field }: { color: string, field: keyof BadgeModel }) => (
     <button
        onClick={() => setShowColorPicker(showColorPicker === field ? null : field)}
        className="w-full h-10 rounded-lg border border-white/10"
        style={{ backgroundColor: color }}
     />
  );

  return (
    <div dir="rtl" className="w-full p-4 bg-neutral-900/50 backdrop-blur-sm border border-white/10 rounded-xl font-sans">
      <div className="flex justify-center mb-4 bg-neutral-900/70 p-1 rounded-xl">
        {Object.entries(tabs).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`relative flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-300
              ${activeTab === key ? 'text-amber-400' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Icon size={16} />
              <span>{label}</span>
            </div>
            {activeTab === key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full shadow-[0_0_10px_theme(colors.amber.500)]" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'layout' && (
          <ControlWrapper>
            <ControlRow label="الحجم (Scale)">
              <GameSlider value={badge.scale} min={0.5} max={2} step={0.05} onChange={(v) => onChange({ scale: v })} />
              <span className="text-neutral-300 text-xs w-12 text-center">{badge.scale.toFixed(2)}x</span>
            </ControlRow>
            <ControlRow label="الدوران (Rotation)">
              <GameSlider value={badge.rotation} min={-180} max={180} step={1} onChange={(v) => onChange({ rotation: v })} />
              <span className="text-neutral-300 text-xs w-12 text-center">{badge.rotation}°</span>
            </ControlRow>
          </ControlWrapper>
        )}

        {activeTab === 'colors' && (
          <ControlWrapper>
            <ControlRow label="لون الخلفية">
              <ColorButton color={badge.color} field="color" />
            </ControlRow>
             {showColorPicker === 'color' && <HexColorPicker color={badge.color} onChange={(c) => onChange({ color: c })} />}
             
            <ControlRow label="لون النص">
               <ColorButton color={badge.textColor} field="textColor" />
            </ControlRow>
            {showColorPicker === 'textColor' && <HexColorPicker color={badge.textColor} onChange={(c) => onChange({ textColor: c })} />}

            <ControlRow label="الشفافية (Opacity)">
              <GameSlider value={badge.opacity} min={0} max={1} step={0.05} onChange={(v) => onChange({ opacity: v })} />
              <span className="text-neutral-300 text-xs w-12 text-center">%{Math.round(badge.opacity * 100)}</span>
            </ControlRow>
          </ControlWrapper>
        )}

        {activeTab === 'effects' && (
          <ControlWrapper>
            <ControlRow label="عرض الإطار">
              <GameSlider value={badge.borderWidth} min={0} max={10} step={0.5} onChange={(v) => onChange({ borderWidth: v })} />
               <span className="text-neutral-300 text-xs w-12 text-center">{badge.borderWidth}px</span>
            </ControlRow>
            <ControlRow label="لون الإطار">
               <ColorButton color={badge.borderColor} field="borderColor" />
            </ControlRow>
             {showColorPicker === 'borderColor' && <HexColorPicker color={badge.borderColor} onChange={(c) => onChange({ borderColor: c })} />}
             
            <ControlRow label="تدوير الحواف">
              <GameSlider value={badge.borderRadius} min={0} max={32} step={1} onChange={(v) => onChange({ borderRadius: v })} />
               <span className="text-neutral-300 text-xs w-12 text-center">{badge.borderRadius}px</span>
            </ControlRow>

            <ControlRow label="قوة التوهج (Shadow)">
              <GameSlider value={badge.shadowBlur} min={0} max={30} step={1} onChange={(v) => onChange({ shadowBlur: v })} />
              <span className="text-neutral-300 text-xs w-12 text-center">{badge.shadowBlur}px</span>
            </ControlRow>
             <ControlRow label="لون التوهج">
               <ColorButton color={badge.shadowColor} field="shadowColor" />
            </ControlRow>
             {showColorPicker === 'shadowColor' && <HexColorPicker color={badge.shadowColor} onChange={(c) => onChange({ shadowColor: c })} />}
          </ControlWrapper>
        )}
        
        {activeTab === 'content' && (
           <ControlWrapper>
              <ControlRow label="النص">
                <Input 
                  value={badge.text ?? ''}
                  onChange={(e) => onChange({ text: e.target.value })}
                  className="bg-neutral-800 border-white/10 text-white rounded-lg"
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
  maxTraits = 5 
}: { 
  selectedTraits: TraitKey[]; 
  onAddTrait: (trait: TraitKey) => void;
  onRemoveTrait: (trait: TraitKey) => void;
  maxTraits?: number;
}) => {
  const availableTraits = TRAIT_OPTIONS.filter(
    trait => !selectedTraits.includes(trait)
  );

  return (
    <div className="space-y-4">
      {selectedTraits.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wide text-slate-600 mb-2 flex items-center gap-2">
            Selected Traits ({selectedTraits.length}/{maxTraits})
          </h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTraits.map((trait) => (
              <TraitIcon
                key={trait}
                trait={trait}
                selected={true}
                onClick={() => onRemoveTrait(trait)}
                className="w-8 h-8"
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-sm uppercase tracking-wide text-slate-600 mb-3 flex items-center gap-2">
          Add Trait
        </h4>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg">
          {availableTraits.slice(0, 18).map((trait) => (
            <TraitIcon
              key={trait}
              trait={trait}
              onClick={() => {
                if (selectedTraits.length < maxTraits) {
                  onAddTrait(trait);
                }
              }}
              className="w-12 h-12"
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
    return <div className="p-4 text-center text-sm text-neutral-500">{t('cards.empty')}</div>;
  }

  return (
    <div className="uiStack">
      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.card')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={10}>
            <div className="flex-1">
              <div className="uiHelp">{t('common.name')} ({t('settings.english')})</div>
              <Input value={nameEn} onChange={(e) => handleUpdateData('name.en', e.target.value)} />
            </div>
            <div className="flex-1">
              <div className="uiHelp">{t('common.name')} ({t('settings.arabic')})</div>
              <Input value={nameAr} onChange={(e) => handleUpdateData('name.ar', e.target.value)} />
            </div>
          </Row>
          <Row gap={10}>
            <div>
              <div className="uiHelp">{t('data.cost')}</div>
              <Input
                type="number"
                value={cost}
                onChange={(e) => handleUpdateData('cost', Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex-1">
              <div className="uiHelp">{t('cards.meta.type', { defaultValue: 'Type' })}</div>
              <Select
                value={element}
                onChange={(e) => handleUpdateData('element', e.target.value || undefined)}
              >
                <option value="">{t('common.none')}</option>
                {Object.keys(ELEMENTS).map((key) => (
                  <option key={key} value={key}>
                    {t(`elements.${key}`, { defaultValue: key })}
                  </option>
                ))}
              </Select>
            </div>
          </Row>
          <div>
            <div className="uiHelp">{t('cards.meta.race')}</div>
            <Select
              value={race}
              onChange={(e) => handleUpdateData('race', e.target.value || undefined)}
            >
              <option value="">{t('common.none')}</option>
              {RACE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`races.${option}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="uiHelp">{t('cards.meta.class', { defaultValue: 'Class' })}</div>
            <TraitPicker
              selectedTraits={traits as TraitKey[]}
              onAddTrait={addTrait}
              onRemoveTrait={removeTrait}
            />
          </div>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.stats')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={10}>
            <div className="flex-1">
              <div className="uiHelp">{t('editor.inspector.attack')}</div>
              <Input
                type="number"
                value={attack}
                onChange={(e) => handleUpdateStat('attack', Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex-1">
              <div className="uiHelp">{t('editor.inspector.defense')}</div>
              <Input
                type="number"
                value={defense}
                onChange={(e) => handleUpdateStat('defense', Number(e.target.value) || 0)}
              />
            </div>
          </Row>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.text')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={10}>
            <div className="flex-1">
              <div className="uiHelp">{t('common.description')} ({t('settings.english')})</div>
              <Input value={descriptionEn} onChange={(e) => handleUpdateData('desc.en', e.target.value)} />
            </div>
            <div className="flex-1">
              <div className="uiHelp">{t('common.description')} ({t('settings.arabic')})</div>
              <Input value={descriptionAr} onChange={(e) => handleUpdateData('desc.ar', e.target.value)} />
            </div>
          </Row>
          <Row gap={10}>
            <div className="flex-1">
              <div className="uiHelp">{t('editor.inspector.ability', { defaultValue: 'Ability Text' })} ({t('settings.english')})</div>
              <Input value={abilityEn} onChange={(e) => handleUpdateData('ability.en', e.target.value)} />
            </div>
            <div className="flex-1">
              <div className="uiHelp">{t('editor.inspector.ability', { defaultValue: 'Ability Text' })} ({t('settings.arabic')})</div>
              <Input value={abilityAr} onChange={(e) => handleUpdateData('ability.ar', e.target.value)} />
            </div>
          </Row>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.visuals', { defaultValue: 'Visuals' })}</summary>
        <div className="uiAccordionBody uiStack">
          <div>
            <div className="uiHelp">{t('editor.inspector.template')}</div>
            <TemplatePicker
              value={templateKey}
              language={language}
              onChange={(next) => handleUpdateData('templateKey', next)}
            />
          </div>
          <div>
            <div className="uiHelp">{t('editor.inspector.rarity')}</div>
            <Select
              value={rarity}
              onChange={(e) => handleUpdateData('rarity', e.target.value)}
            >
              {RARITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getRarityLabel(option, language)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="uiHelp">{t('data.uploadImage')}</div>
            <Row gap={8}>
              <Button variant="outline" size="sm" onClick={onPickImage}>{t('data.uploadImage')}</Button>
            </Row>
          </div>
          {assetOptions.length > 0 && (
            <div className="uiStack" style={{ gap: 8 }}>
              <div className="uiHelp">{t('assets.title', { defaultValue: 'Assets' })}</div>
              <div
                className="assets-grid"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}
              >
                {assetOptions.map((asset) => {
                  const isSelected =
                    art?.kind === 'image' && (art.src === asset.resolvedSrc || art.src === asset.src);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      className={`asset-card ${isSelected ? 'asset-card-active' : ''}`}
                      onClick={() => { if(cardData) onChange({ ...cardData, art: { kind: 'image', src: asset.resolvedSrc } }) }}
                    >
                      <div
                        className="asset-thumb"
                        style={{ backgroundImage: `url("${asset.resolvedSrc}")` }}
                      />
                      <div className="asset-meta">
                        <div className="asset-name">{asset.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="uiHelp">
            {art?.kind === 'video'
              ? t('data.videoUsesPoster')
              : art?.kind === 'image'
                ? t('data.imageSelected')
                : t('data.noArtwork')}
          </div>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">🎨 تصميم الشارة</summary>
        <div className="uiAccordionBody uiStack">
          <div className="uiStack" style={{ gap: 10 }}>
            <Select 
              value={selectedBadgeId} 
              onChange={(e) => setSelectedBadgeId(e.target.value as any)}
              style={{ fontWeight: 'bold' }}
            >
              <option value="attackBadge">شارة الهجوم</option>
              <option value="defenseBadge">شارة الدفاع</option>
              <option value="elementBadge">شارة العنصر</option>
              <option value="tribe">شارة الفئة</option>
            </Select>
            <BadgeStylingPanel
              badge={selectedBadgeStyle}
              onChange={handleBadgeChange}
            />
          </div>
        </div>
      </details>

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