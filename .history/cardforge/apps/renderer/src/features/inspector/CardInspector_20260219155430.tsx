﻿import { useMemo, useState } from 'react';
import type { CardArt, CardRace, CardTrait, DataRow, ElementKey, Project } from '../../../../../packages/core/src/index';
import { getParentPath } from '@cardsmith/storage';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import { 
  Palette, Maximize, Image as ImageIcon, X, RotateCcw, MoveHorizontal, Square, Move, 
  Layout, Wand2, Type, Eye, EyeOff, Layers, Shield, Zap, Star, Heart, Sword, Flame, Moon, 
  Droplets, Diamond, Mic, Skull, Ghost, Anchor, Sun, Crown, ArrowRight, Circle,
  BadgeCheck  // ← أضفت هذا للـ Badge tab
} from 'lucide-react';
import { Button, Input, Row, Select } from '../../components/ui';
import { CARD_TEMPLATES, type TemplateKey } from '../../templates/cardTemplates';
import type { Rarity } from '../../lib/balanceRules';
import { TemplatePicker } from '../templates/TemplatePicker';
import { TraitIcon, TRAIT_META, type TraitKey } from '../../ui/icons/traitIcons';
import { ELEMENTS } from '../../lib/elements';
import { resolveImageSrc } from '../../utils/file';
import { UltimateBadgeEditor } from './UltimateBadgeEditor';
import BadgeStylingPanel from './BadgeStylingPanel';  // ✅ صحيح


type Props = {
  row?: DataRow;
  project: Project;
  columns: string[];
  language: 'en' | 'ar';
  onUpdateData: (path: string, value: any) => void;
  onUpdateStat: (key: 'attack' | 'defense', value: number) => void;
  onUpdateRow: (patch: Partial<DataRow>) => void;
  onPickImage: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const RARITY_OPTIONS: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const RACE_OPTIONS: CardRace[] = ['human', 'elf', 'demon', 'beast', 'animal', 'amphibian'];
const TRAIT_OPTIONS: TraitKey[] = ['fire', 'ice', 'swordsman', 'archer', 'mage', 'tank', 'poison', 'flying', 'holy', 'shadow'];

export function CardInspector(props: Props) {
  const { t } = useTranslation();
  const [traitQuery, setTraitQuery] = useState('');
  const row = props.row;
  const data = row?.data ?? {};
  const art: CardArt | undefined = row?.art ?? (data as any).art;
  const rarity = normalizeRarity(data.rarity);
  const templateKey = normalizeTemplateKey(data.templateKey ?? data.template);
  const race = normalizeRace(data.race);
  const element = normalizeElement(data.element);
  const traits = normalizeTraits(data.traits ?? (data as any).trait);
  const attack = normalizeNumber(data.attack ?? data.stats?.attack);
  const defense = normalizeNumber(data.defense ?? data.stats?.defense);
  const cost = data.cost != null ? normalizeNumber(data.cost) : '';
  const nameEn = getLocalizedValue(data.name ?? data.title ?? data.character_name ?? data.character_name_en, 'en');
  const nameAr = getLocalizedValue(data.name ?? data.title ?? data.character_name ?? data.character_name_ar, 'ar');
  const descriptionValue = data.desc ?? data.description ?? data.description_en ?? data.description_ar;
  const descriptionEn = getLocalizedValue(descriptionValue, 'en');
  const descriptionAr = getLocalizedValue(descriptionValue, 'ar');
  const abilityValue =
    data.ability ??
    data.ability_name ??
    data.ability_en ??
    data.ability_ar ??
    data.ability_name_en ??
    data.ability_name_ar;
  const abilityEn = getLocalizedValue(abilityValue, 'en');
  const abilityAr = getLocalizedValue(abilityValue, 'ar');
  const projectRoot = props.project.meta.filePath ? getParentPath(props.project.meta.filePath) : '';
  const assetOptions = useMemo(
    () =>
      (props.project.assets?.images ?? []).map((asset) => ({
        id: asset.id,
        name: asset.name,
        src: asset.src,
        resolvedSrc: resolveImageSrc(asset.src, projectRoot),
      })),
    [projectRoot, props.project.assets?.images],
  );
  const badgeStyles = (data as any)?.style?.badges ?? {};
  const attackBadge = badgeStyles.attackBadge ?? {};
  const defenseBadge = badgeStyles.defenseBadge ?? {};
  const elementBadge = badgeStyles.elementBadge ?? {};
  const tribeBadge = badgeStyles.tribe ?? {};

  const getAssetIdForIcon = (iconUrl?: string) => {
    if (!iconUrl) return '';
    const match = assetOptions.find((asset) => asset.resolvedSrc === iconUrl || asset.src === iconUrl);
    return match?.id ?? '';
  };

  const traitSet = new Set(traits);
  const normalizedTraitQuery = traitQuery.trim().toLowerCase();
  const traitSuggestions = useMemo(() => {
    const list = TRAIT_OPTIONS.filter((trait) => !traitSet.has(trait as CardTrait));
    if (!normalizedTraitQuery) return list.slice(0, 8);
    return list
      .filter((trait) => {
        const meta = TRAIT_META[trait];
        const label = t(meta?.labelKey ?? `traits.${trait}`, { defaultValue: trait }).toLowerCase();
        return trait.includes(normalizedTraitQuery) || label.includes(normalizedTraitQuery);
      })
      .slice(0, 8);
  }, [normalizedTraitQuery, traitSet, t]);

  const addTrait = (trait: string) => {
    const cleaned = String(trait || '').toLowerCase().trim();
    if (!cleaned) return;
    if (traitSet.has(cleaned as CardTrait)) {
      setTraitQuery('');
      return;
    }
    props.onUpdateData('traits', Array.from(new Set([...traits, cleaned])));
    setTraitQuery('');
  };

  const removeTrait = (trait: string) => {
    const cleaned = String(trait || '').toLowerCase().trim();
    props.onUpdateData(
      'traits',
      traits.filter((item) => String(item).toLowerCase().trim() !== cleaned),
    );
  };

  const [selectedBadgeId, setSelectedBadgeId] = useState<'attackBadge' | 'defenseBadge' | 'elementBadge' | 'tribe'>('attackBadge');

  if (!row) {
    return <div className="empty">{t('cards.empty')}</div>;
  }

  return (
    <div className="uiStack">
      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.card')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={10}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('common.name')} ({t('settings.english')})</div>
              <Input value={nameEn} onChange={(e) => props.onUpdateData('name.en', e.target.value)} />
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('common.name')} ({t('settings.arabic')})</div>
              <Input value={nameAr} onChange={(e) => props.onUpdateData('name.ar', e.target.value)} />
            </div>
          </Row>
          <Row gap={10}>
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('data.cost')}</div>
              <Input
                type="number"
                value={cost}
                onChange={(e) => props.onUpdateData('cost', Number(e.target.value) || 0)}
              />
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('cards.meta.type', { defaultValue: 'Type' })}</div>
              <Select
                value={element}
                onChange={(e) => props.onUpdateData('element', e.target.value || undefined)}
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
              onChange={(e) => props.onUpdateData('race', e.target.value || undefined)}
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
            <div className="uiStack" style={{ gap: 8 }}>
              <Input
                placeholder={t('cards.search')}
                value={traitQuery}
                onChange={(e) => setTraitQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (traitSuggestions.length) {
                      addTrait(traitSuggestions[0]);
                    } else {
                      addTrait(traitQuery);
                    }
                  }
                }}
              />
              {traitSuggestions.length ? (
                <div className="traitsChips">
                  {traitSuggestions.map((trait) => {
                    const meta = TRAIT_META[trait];
                    const label = t(meta?.labelKey ?? `traits.${trait}`, { defaultValue: trait });
                    return (
                      <button
                        key={trait}
                        type="button"
                        className={`chip chip--suggestion ${meta ? `chip--${meta.tintClass}` : ''}`}
                        onClick={() => addTrait(trait)}
                      >
                        <span className="chipIcon">
                          <TraitIcon trait={trait} size={14} />
                        </span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div className="traitsChips">
                {traits.map((trait) => {
                  const key = String(trait);
                  const meta = TRAIT_META[key];
                  const label = t(meta?.labelKey ?? `traits.${key}`, { defaultValue: key });
                  return (
                    <span key={key} className={`chip ${meta ? `chip--${meta.tintClass}` : ''}`}>
                      <span className="chipIcon">
                        <TraitIcon trait={key} size={14} />
                      </span>
                      <span>{label}</span>
                      <button
                        type="button"
                        className="chipRemove"
                        onClick={() => removeTrait(key)}
                        aria-label={t('common.delete')}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.stats')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={10}>
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('editor.inspector.attack')}</div>
              <Input
                type="number"
                value={attack}
                onChange={(e) => props.onUpdateStat('attack', Number(e.target.value) || 0)}
              />
            </div>
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('editor.inspector.defense')}</div>
              <Input
                type="number"
                value={defense}
                onChange={(e) => props.onUpdateStat('defense', Number(e.target.value) || 0)}
              />
            </div>
          </Row>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.text')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={10}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('common.description')} ({t('settings.english')})</div>
              <Input value={descriptionEn} onChange={(e) => props.onUpdateData('desc.en', e.target.value)} />
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('common.description')} ({t('settings.arabic')})</div>
              <Input value={descriptionAr} onChange={(e) => props.onUpdateData('desc.ar', e.target.value)} />
            </div>
          </Row>
          <Row gap={10}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('editor.inspector.ability', { defaultValue: 'Ability Text' })} ({t('settings.english')})</div>
              <Input value={abilityEn} onChange={(e) => props.onUpdateData('ability.en', e.target.value)} />
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('editor.inspector.ability', { defaultValue: 'Ability Text' })} ({t('settings.arabic')})</div>
              <Input value={abilityAr} onChange={(e) => props.onUpdateData('ability.ar', e.target.value)} />
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
              language={props.language}
              onChange={(next) => props.onUpdateData('templateKey', next)}
            />
          </div>
          <div>
            <div className="uiHelp">{t('editor.inspector.rarity')}</div>
            <Select
              value={rarity}
              onChange={(e) => props.onUpdateData('rarity', e.target.value)}
            >
              {RARITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getRarityLabel(option, props.language)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="uiHelp">{t('data.uploadImage')}</div>
            <Row gap={8}>
              <Button variant="outline" size="sm" onClick={props.onPickImage}>{t('data.uploadImage')}</Button>
            </Row>
          </div>
          {assetOptions.length ? (
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
                      onClick={() => props.onUpdateRow({ art: { kind: 'image', src: asset.resolvedSrc } })}
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
          ) : (
            <div className="uiHelp">{t('assets.noAssets', { defaultValue: 'No assets yet.' })}</div>
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

      <details className="uiAccordion">
        <summary className="uiAccordionHeader">🎨 BADGE STYLING</summary>
        <div className="uiAccordionBody uiStack">
          <div className="uiStack" style={{ gap: 10 }}>
            <Select 
              value={selectedBadgeId} 
              onChange={(e) => setSelectedBadgeId(e.target.value as any)}
              style={{ fontWeight: 'bold' }}
            >
              <option value="attackBadge">{t('editor.inspector.attack', { defaultValue: 'Attack' })}</option>
              <option value="defenseBadge">{t('editor.inspector.defense', { defaultValue: 'Defense' })}</option>
              <option value="elementBadge">{t('cards.element', { defaultValue: 'Element' })}</option>
              <option value="tribe">أيقونات الفئة (Traits)</option>
            </Select>
<UltimateBadgeEditor
  badges={Object.entries(badgeStyles).map(([id, style]) => ({
    id,
    type: 'icon',
    name: id,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    opacity: 1,
    backgroundOpacity: 0.2,
    color: '#ffffff',
    gradientType: 'linear',
    gradientAngle: 135,
    borderWidth: 0,
    shadowIntensity: 0,
    zIndex: 1,
    ...style
  }))}
 onUpdate={(badges) => {
  console.log('💾 Saving badges:', badges);  // ✅ للاختبار
  
  // 🔥 تحويل badges للـ badgeStyles format
  const badgeStyles = {};
  badges.forEach(badge => {
    badgeStyles[badge.id] = {
      color: badge.color,
      scale: badge.scale,
      rotation: badge.rotation,
      opacity: badge.opacity,
      // باقي الخصائص اللي تبيها
    };
  });
  
  // 🔥 حفظ في الـ card باستخدام onUpdateRow مع فحص آمن
  if (typeof props.onChange === 'function') {
    props.onChange({
      badgeStyles
    });
  } else {
    props.onUpdateRow({
      data: {
        ...data,
        style: {
          ...(data as Record<string, unknown>).style,
          badges: badgeStyles
        }
      }
    });
  }
}}

/>
          </div>
        </div>
      </details>

    </div>
  );
}

const BADGE_PRESETS = [
  { id: 'default', name: 'Default', style: { scale: 1, color: '', shadow: 'none', borderWidth: 0 } },
  { id: 'neon', name: 'Neon', style: { scale: 1.1, color: '#00ffcc', shadow: 'neon', borderWidth: 2, borderColor: '#00ffcc', glow: 5 } },
  { id: 'dark', name: 'Dark', style: { scale: 1, color: '#1a1a1a', shadow: 'strong', borderWidth: 1, borderColor: '#444' } },
  { id: 'glass', name: 'Glass', style: { scale: 1, color: 'rgba(255,255,255,0.2)', shadow: 'soft', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', opacity: 0.9 } },
  { id: 'flat', name: 'Flat', style: { scale: 1, color: '#3b82f6', shadow: 'none', borderWidth: 0, borderRadius: 4 } },
];

const ICON_LIBRARY = [
  { id: 'shield', icon: Shield }, { id: 'sword', icon: Sword }, { id: 'heart', icon: Heart },
  { id: 'zap', icon: Zap }, { id: 'flame', icon: Flame }, { id: 'droplets', Droplets },
  { id: 'crown', icon: Crown }, { id: 'star', icon: Star }, { id: 'moon', icon: Moon },
  { id: 'sun', icon: Sun }, { id: 'diamond', icon: Diamond }, { id: 'skull', icon: Skull },
  { id: 'ghost', icon: Ghost }, { id: 'anchor', icon: Anchor }, { id: 'mic', icon: Mic },
  { id: 'arrowRight', icon: ArrowRight }, { id: 'circle', icon: Circle }
];

interface BadgeStylingPanelProps {
  badge: any;
  onChange: (newStyle: any) => void;
  assetOptions: { id: string; name: string; resolvedSrc: string }[];
  t: (key: string, options?: any) => string;
}

function BadgeStylingPanel({ badge, onChange, assetOptions, t }: BadgeStylingPanelProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'layout' | 'colors' | 'effects' | 'content'>('layout');
  
  const update = (key: string, val: any) => onChange({ ...badge, [key]: val });
  const [showColor, setShowColor] = useState(false);
  const [showColor2, setShowColor2] = useState(false);
  const [showBorderColor, setShowBorderColor] = useState(false);

  return (
    <div className="uiStack" style={{ gap: 12 }}>
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'presets', icon: Layout },
          { id: 'layout', icon: Move },
          { id: 'colors', icon: Palette },
          { id: 'effects', icon: Wand2 },
          { id: 'content', icon: Type },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 p-2 flex justify-center ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            title={tab.id}
          >
            <tab.icon size={16} />
          </button>
        ))}
      </div>

      {/* PRESETS TAB */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-3 gap-2">
          {BADGE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => onChange({ ...badge, ...preset.style })}
              className="p-2 border rounded hover:bg-slate-50 text-xs text-center"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* LAYOUT TAB */}
      {activeTab === 'layout' && (
        <div className="uiStack" style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <span className="uiSub">Visibility</span>
            <button onClick={() => update('visible', !badge.visible)} className="iconButton">
              {badge.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </Row>
          <ControlRow label="Scale" icon={<Maximize size={14} />}>
            <Input type="range" min={0.2} max={3} step={0.1} value={badge.scale ?? 1} onChange={e => update('scale', +e.target.value)} />
            <span className="w-8 text-right text-xs">{badge.scale ?? 1}x</span>
          </ControlRow>
          <ControlRow label="Rotation" icon={<RotateCcw size={14} />}>
            <Input type="range" min={-180} max={180} step={5} value={badge.rotation ?? 0} onChange={e => update('rotation', +e.target.value)} />
            <span className="w-8 text-right text-xs">{badge.rotation ?? 0}°</span>
          </ControlRow>
          <ControlRow label="X Offset" icon={<MoveHorizontal size={14} />}>
            <Input type="range" min={-100} max={100} value={badge.xOffset ?? 0} onChange={e => update('xOffset', +e.target.value)} />
            <span className="w-8 text-right text-xs">{badge.xOffset ?? 0}</span>
          </ControlRow>
          <ControlRow label="Y Offset" icon={<Move size={14} />}>
            <Input type="range" min={-100} max={100} value={badge.yOffset ?? 0} onChange={e => update('yOffset', +e.target.value)} />
            <span className="w-8 text-right text-xs">{badge.yOffset ?? 0}</span>
          </ControlRow>
          <ControlRow label="Gap" icon={<Layout size={14} />}>
            <Input type="range" min={0} max={20} value={badge.gap ?? 4} onChange={e => update('gap', +e.target.value)} />
            <span className="w-8 text-right text-xs">{badge.gap ?? 4}</span>
          </ControlRow>
        </div>
      )}

      {/* COLORS TAB */}
      {activeTab === 'colors' && (
        <div className="uiStack" style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <span className="uiSub">Gradient</span>
            <input type="checkbox" checked={!!badge.gradient} onChange={e => update('gradient', e.target.checked)} />
          </Row>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1"><span className="uiSub">Primary</span></div>
            <button onClick={() => setShowColor(!showColor)} className="w-full h-8 rounded border" style={{ backgroundColor: badge.color || '#fff' }} />
            {showColor && <div className="absolute z-10 mt-1"><div className="fixed inset-0" onClick={() => setShowColor(false)} /><HexColorPicker color={badge.color || '#fff'} onChange={c => update('color', c)} /></div>}
          </div>
          {badge.gradient && (
            <div className="relative">
              <div className="flex items-center gap-2 mb-1"><span className="uiSub">Secondary</span></div>
              <button onClick={() => setShowColor2(!showColor2)} className="w-full h-8 rounded border" style={{ backgroundColor: badge.color2 || '#fff' }} />
              {showColor2 && <div className="absolute z-10 mt-1"><div className="fixed inset-0" onClick={() => setShowColor2(false)} /><HexColorPicker color={badge.color2 || '#fff'} onChange={c => update('color2', c)} /></div>}
            </div>
          )}
          <ControlRow label="Opacity" icon={<Eye size={14} />}>
            <Input type="range" min={0} max={1} step={0.1} value={badge.opacity ?? 1} onChange={e => update('opacity', +e.target.value)} />
            <span className="w-8 text-right text-xs">{badge.opacity ?? 1}</span>
          </ControlRow>
        </div>
      )}

      {/* EFFECTS TAB */}
      {activeTab === 'effects' && (
        <div className="uiStack" style={{ gap: 8 }}>
          <ControlRow label="Border Width" icon={<Square size={14} />}>
            <Input type="range" min={0} max={10} step={0.5} value={badge.borderWidth ?? 0} onChange={e => update('borderWidth', +e.target.value)} />
            <span className="w-8 text-right text-xs">{badge.borderWidth ?? 0}</span>
          </ControlRow>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1"><span className="uiSub">Border Color</span></div>
            <button onClick={() => setShowBorderColor(!showBorderColor)} className="w-full h-8 rounded border" style={{ backgroundColor: badge.borderColor || 'transparent' }} />
            {showBorderColor && <div className="absolute z-10 mt-1"><div className="fixed inset-0" onClick={() => setShowBorderColor(false)} /><HexColorPicker color={badge.borderColor || '#fff'} onChange={c => update('borderColor', c)} /></div>}
          </div>
          <div className="uiSub">Shadow Preset</div>
          <Select value={badge.shadow ?? 'none'} onChange={e => update('shadow', e.target.value)}>
            <option value="none">None</option>
            <option value="soft">Soft</option>
            <option value="strong">Strong</option>
            <option value="neon">Neon</option>
          </Select>
          <ControlRow label="Glow Intensity" icon={<Wand2 size={14} />}>
            <Input type="range" min={0} max={20} value={badge.glow ?? 0} onChange={e => update('glow', +e.target.value)} />
            <span className="w-8 text-right text-xs">{badge.glow ?? 0}</span>
          </ControlRow>
        </div>
      )}

      {/* CONTENT TAB */}
      {activeTab === 'content' && (
        <div className="uiStack" style={{ gap: 8 }}>
          <div className="uiSub">Label Text</div>
          <Input value={badge.text || ''} onChange={e => update('text', e.target.value)} placeholder="e.g. ATK" />
          
          <div className="uiSub">Icon</div>
          <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 border rounded">
            <button 
              onClick={() => update('iconId', '')} 
              className={`p-2 rounded flex justify-center items-center hover:bg-slate-100 ${!badge.iconId ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
              title="None"
            >
              <X size={16} />
            </button>
            {ICON_LIBRARY.map(item => (
              <button
                key={item.id}
                onClick={() => update('iconId', item.id)}
                className={`p-2 rounded flex justify-center items-center hover:bg-slate-100 ${badge.iconId === item.id ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                title={item.id}
              >
                {item.icon && <item.icon size={16} />}
              </button>
            ))}
          </div>
          
          <div className="uiSub">Custom Icon</div>
          <Select
            value={assetOptions.find((a: any) => a.resolvedSrc === badge.iconUrl)?.id || ''}
            onChange={(e) => {
              const asset = assetOptions.find((a: any) => a.id === e.target.value);
              update('iconUrl', asset ? asset.resolvedSrc : '');
            }}
          >
            <option value="">{t('common.none')}</option>
            {assetOptions.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}

function ControlRow({ label, icon, children }: { label: string, icon: any, children: any }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-slate-400" title={label}>{icon}</div>
      {children}
    </div>
  );
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

function normalizeRace(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  if (!cleaned) return '';
  return cleaned as CardRace;
}

function normalizeElement(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  if (!cleaned) return '';
  return cleaned as ElementKey;
}

function normalizeTraits(value: any) {
  if (Array.isArray(value)) {
    return value.map((trait) => String(trait).toLowerCase().trim()).filter(Boolean) as CardTrait[];
  }
  const raw = String(value || '').trim();
  if (!raw) return [] as CardTrait[];
  return raw
    .split(/[,|]/g)
    .map((trait) => trait.trim().toLowerCase())
    .filter(Boolean) as CardTrait[];
}

function normalizeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function fileToDataUrl(file: File, errorMessage: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(errorMessage));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
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
