﻿import { useMemo, useState } from 'react';
import type { CardArt, CardRace, CardTrait, DataRow, ElementKey, Project } from '../../../../../packages/core/src/index';
import { getParentPath } from '@cardsmith/storage';
import { useTranslation } from 'react-i18next';
import { HexColorPicker } from 'react-colorful';
import { Palette, Maximize, Image as ImageIcon, X, RotateCcw, MoveHorizontal } from 'lucide-react';
import { Button, Input, Row, Select } from '../../components/ui';
import { CARD_TEMPLATES, type TemplateKey } from '../../templates/cardTemplates';
import type { Rarity } from '../../lib/balanceRules';
import { TemplatePicker } from '../templates/TemplatePicker';
import { TraitIcon, TRAIT_META, type TraitKey } from '../../ui/icons/traitIcons';
import { ELEMENTS } from '../../lib/elements';
import { resolveImageSrc } from '../../utils/file';

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

  const updateBadgeField = (badgeKey: 'attackBadge' | 'defenseBadge' | 'elementBadge' | 'tribe', field: string, value: any) => {
    props.onUpdateData(`style.badges.${badgeKey}.${field}`, value);
  };

  const getAssetIdForIcon = (iconUrl?: string) => {
    if (!iconUrl) return '';
    const match = assetOptions.find((asset) => asset.resolvedSrc === iconUrl || asset.src === iconUrl);
    return match?.id ?? '';
  };

  const pickBadgeIcon = (badgeKey: 'attackBadge' | 'defenseBadge' | 'elementBadge' | 'tribe') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file, t('editor.errors.readImage'));
        updateBadgeField(badgeKey, 'iconUrl', dataUrl);
      } catch {
        // Fall back silently; error already handled in fileToDataUrl
      }
    };
    input.click();
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
          <BadgeControl
            label={t('cards.element', { defaultValue: 'Element' })}
            value={elementBadge}
            onChange={(field, val) => updateBadgeField('elementBadge', field, val)}
            onPickIcon={() => pickBadgeIcon('elementBadge')}
            assetOptions={assetOptions}
            t={t}
          />
          <BadgeControl
            label="أيقونات الفئة (Traits)"
            value={tribeBadge}
            onChange={(field, val) => updateBadgeField('tribe', field, val)}
            onPickIcon={() => pickBadgeIcon('tribe')}
            assetOptions={assetOptions}
            t={t}
            showGap={true}
          />
          <BadgeControl
            label={t('editor.inspector.attack', { defaultValue: 'Attack' })}
            value={attackBadge}
            onChange={(field, val) => updateBadgeField('attackBadge', field, val)}
            onPickIcon={() => pickBadgeIcon('attackBadge')}
            assetOptions={assetOptions}
            t={t}
          />
          <BadgeControl
            label={t('editor.inspector.defense', { defaultValue: 'Defense' })}
            value={defenseBadge}
            onChange={(field, val) => updateBadgeField('defenseBadge', field, val)}
            onPickIcon={() => pickBadgeIcon('defenseBadge')}
            assetOptions={assetOptions}
            t={t}
          />
        </div>
      </details>

    </div>
  );
}

function BadgeControl({
  label,
  value,
  onChange,
  onPickIcon,
  assetOptions,
  t,
  showGap,
}: {
  label: string;
  value: any;
  onChange: (field: string, val: any) => void;
  onPickIcon: () => void;
  assetOptions: { id: string; name: string; resolvedSrc: string }[];
  t: any;
  showGap?: boolean;
}) {
  const scale = value?.scale ?? 1;
  const color = value?.color ?? '';
  const iconUrl = value?.iconUrl ?? '';
  const gap = value?.gap ?? 4;
  const [showColor, setShowColor] = useState(false);

  return (
    <div className="uiStack" style={{ gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="uiSub" style={{ fontWeight: 600 }}>{label}</div>
        <button
          type="button"
          className="iconButton"
          onClick={() => {
            onChange('scale', 1);
            onChange('color', '');
            onChange('iconUrl', '');
          }}
          title={t('common.reset')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <RotateCcw size={14} />
        </button>
      </Row>

      <Row gap={8} style={{ alignItems: 'center' }}>
        <Maximize size={16} style={{ opacity: 0.5 }} />
        <Input
          type="range"
          min={0.5}
          max={1.5}
          step={0.1}
          value={scale}
          onChange={(e) => onChange('scale', Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span className="uiHelp" style={{ width: 30, textAlign: 'right' }}>{scale}x</span>
      </Row>

      {showGap && (
        <Row gap={8} style={{ alignItems: 'center' }}>
          <MoveHorizontal size={16} style={{ opacity: 0.5 }} />
          <Input
            type="range"
            min={0}
            max={20}
            step={1}
            value={gap}
            onChange={(e) => onChange('gap', Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span className="uiHelp" style={{ width: 30, textAlign: 'right' }}>{gap}</span>
        </Row>
      )}

      <Row gap={8} style={{ alignItems: 'center', position: 'relative' }}>
        <Palette size={16} style={{ opacity: 0.5 }} />
        <button
          type="button"
          onClick={() => setShowColor(!showColor)}
          style={{
            flex: 1,
            height: 28,
            borderRadius: 4,
            border: '1px solid var(--border-color)',
            backgroundColor: color || 'transparent',
            backgroundImage: !color ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            cursor: 'pointer'
          }}
        />
        {color && (
          <button
            type="button"
            onClick={() => onChange('color', '')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={14} />
          </button>
        )}
        {showColor && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4 }}>
            <div style={{ position: 'fixed', inset: 0 }} onClick={() => setShowColor(false)} />
            <HexColorPicker color={color || '#ffffff'} onChange={(c) => onChange('color', c)} />
          </div>
        )}
      </Row>

      <Row gap={8} style={{ alignItems: 'center' }}>
        <ImageIcon size={16} style={{ opacity: 0.5 }} />
        <Select
          value={assetOptions.find((a) => a.resolvedSrc === iconUrl)?.id || ''}
          onChange={(e) => {
            const asset = assetOptions.find((a) => a.id === e.target.value);
            onChange('iconUrl', asset ? asset.resolvedSrc : '');
          }}
          style={{ flex: 1 }}
        >
          <option value="">{t('common.none')}</option>
          {assetOptions.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </Select>
        <Button size="sm" variant="outline" onClick={onPickIcon} style={{ padding: '0 8px' }}>
          <ImageIcon size={14} />
        </Button>
      </Row>
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
