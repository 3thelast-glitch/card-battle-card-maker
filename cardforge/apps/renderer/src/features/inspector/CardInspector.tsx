import React from 'react';
import { useMemo, useState } from 'react';
import type { CardArt, CardRace, CardTrait, DataRow, Project } from '../../../../../packages/core/src/index';
import { resolvePath } from '../../../../../packages/core/src/index';
import { useTranslation } from 'react-i18next';
import { Button, Input, Row, Select, Toggle, Badge, Divider } from '../../components/ui';
import type { TemplateKey } from '../../templates/cardTemplates';
import type { Rarity } from '../../lib/balanceRules';
import { TemplatePicker } from '../templates/TemplatePicker';
import { TraitIcon, TRAIT_META, type TraitKey } from '../../ui/icons/traitIcons';

type Props = {
  row?: DataRow;
  project: Project;
  columns: string[];
  language: 'en' | 'ar';
  showVideoControls: boolean;
  onToggleVideoControls: (next: boolean) => void;
  onUpdateData: (path: string, value: any) => void;
  onUpdateStat: (key: 'attack' | 'defense', value: number) => void;
  onUpdateRow: (patch: Partial<DataRow>) => void;
  onPickImage: () => void;
  onPickVideo: () => void;
  onRegeneratePoster: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

const RARITY_OPTIONS: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const RACE_OPTIONS: CardRace[] = ['human', 'elf', 'demon', 'beast', 'animal', 'amphibian'];
const TRAIT_OPTIONS: TraitKey[] = ['fire', 'ice', 'swordsman', 'archer', 'mage', 'tank', 'poison', 'flying'];

export function CardInspector(props: Props) {
  const { t } = useTranslation();
  const [traitQuery, setTraitQuery] = useState('');
  const row = props.row;
  const data = row?.data ?? {};
  const art: CardArt | undefined = row?.art ?? (data as any).art;
  const rarity = normalizeRarity(data.rarity);
  const templateKey = normalizeTemplateKey(data.templateKey ?? data.template);
  const race = normalizeRace(data.race);
  const traits = normalizeTraits(data.traits ?? (data as any).trait);
  const bgColor = String(data.bgColor ?? '');
  const attack = normalizeNumber(data.attack ?? data.stats?.attack);
  const defense = normalizeNumber(data.defense ?? data.stats?.defense);
  const cost = data.cost != null ? normalizeNumber(data.cost) : '';
  const nameEn = getLocalizedValue(data.name ?? data.title ?? data.character_name ?? data.character_name_en, 'en');
  const nameAr = getLocalizedValue(data.name ?? data.title ?? data.character_name ?? data.character_name_ar, 'ar');
  const abilityEn = getLocalizedValue(data.desc ?? data.ability ?? data.ability_en, 'en');
  const abilityAr = getLocalizedValue(data.desc ?? data.ability ?? data.ability_ar, 'ar');
  const tagsValue = Array.isArray(data.tags) ? data.tags.join(', ') : String(data.tags ?? '');
  const missingPoster = art?.kind === 'video' && !art.poster;
  const missingFields = !hasLocalizedValue(data.name) || !hasLocalizedValue(data.desc ?? data.ability);
  const total = attack + defense;

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

  const customColumns = props.columns.filter((key) => !isReservedColumn(key));

  if (!row) {
    return <div className="empty">{t('cards.empty')}</div>;
  }

  return (
    <div className="uiStack">
      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.card')}</summary>
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
            <div className="uiHelp">{t('cards.meta.traits')}</div>
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
            <div className="uiHelp">{t('editor.inspector.background')}</div>
            <Input value={bgColor} onChange={(e) => props.onUpdateData('bgColor', e.target.value)} />
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
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('data.cost')}</div>
              <Input
                type="number"
                value={cost}
                onChange={(e) => props.onUpdateData('cost', Number(e.target.value) || 0)}
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
              <div className="uiHelp">{t('common.name')} ({t('settings.english')})</div>
              <Input value={nameEn} onChange={(e) => props.onUpdateData('name.en', e.target.value)} />
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('common.name')} ({t('settings.arabic')})</div>
              <Input value={nameAr} onChange={(e) => props.onUpdateData('name.ar', e.target.value)} />
            </div>
          </Row>
          <Row gap={10}>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('editor.inspector.ability')} ({t('settings.english')})</div>
              <Input value={abilityEn} onChange={(e) => props.onUpdateData('desc.en', e.target.value)} />
            </div>
            <div style={{ minWidth: 200, flex: 1 }}>
              <div className="uiHelp">{t('editor.inspector.ability')} ({t('settings.arabic')})</div>
              <Input value={abilityAr} onChange={(e) => props.onUpdateData('desc.ar', e.target.value)} />
            </div>
          </Row>
        </div>
      </details>

      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.media')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={8}>
            <Button variant="outline" size="sm" onClick={props.onPickImage}>{t('data.uploadImage')}</Button>
            <Button variant="outline" size="sm" onClick={props.onPickVideo}>{t('data.uploadVideo')}</Button>
          </Row>
          <div className="uiHelp">
            {art?.kind === 'video'
              ? t('data.videoUsesPoster')
              : art?.kind === 'image'
                ? t('data.imageSelected')
                : t('data.noArtwork')}
          </div>
          <div className="uiHelp">{t('ui.tip.videoPoster')}</div>
          <Row gap={8}>
            <Button variant="outline" size="sm" onClick={props.onRegeneratePoster} disabled={!art || art.kind !== 'video'}>
              {t('data.generatePoster')}
            </Button>
            <Toggle
              checked={props.showVideoControls}
              onChange={props.onToggleVideoControls}
              label={t('data.showVideoControls')}
            />
          </Row>
        </div>
      </details>

      <details className="uiAccordion">
        <summary className="uiAccordionHeader">{t('cards.advanced')}</summary>
        <div className="uiAccordionBody uiStack">
          <Row gap={8}>
            <Badge>{t('editor.inspector.attack')}: {attack}</Badge>
            <Badge>{t('editor.inspector.defense')}: {defense}</Badge>
            <Badge>Total: {total}</Badge>
            {missingPoster ? <Badge variant="warn">{t('data.posterRequired')}</Badge> : null}
            {missingFields ? <Badge variant="warn">{t('export.missingFields', { count: 1 })}</Badge> : null}
          </Row>
          <Divider />
          <div>
            <div className="uiHelp">ID</div>
            <Input value={props.row.id} readOnly />
          </div>
          <Row gap={10}>
            <div style={{ minWidth: 160, flex: 1 }}>
              <div className="uiHelp">{t('data.setColumn')}</div>
              <Select
                value={props.row.setId ?? props.project.sets[0]?.id}
                onChange={(e) => props.onUpdateRow({ setId: e.target.value })}
              >
                {props.project.sets.map((set) => (
                  <option key={set.id} value={set.id}>{set.name}</option>
                ))}
              </Select>
            </div>
            <div style={{ minWidth: 120 }}>
              <div className="uiHelp">{t('data.quantityColumn')}</div>
              <Input
                type="number"
                min={1}
                value={props.row.quantity ?? 1}
                onChange={(e) => props.onUpdateRow({ quantity: Number(e.target.value) || 1 })}
              />
            </div>
          </Row>
          <div>
            <div className="uiHelp">{t('cards.tag')}</div>
            <Input value={tagsValue} onChange={(e) => props.onUpdateData('tags', e.target.value)} />
          </div>
          {customColumns.length ? (
            <div className="uiStack">
              <div className="uiHelp">Fields</div>
              {customColumns.map((key) => (
                <div key={key}>
                  <div className="uiHelp">{key}</div>
                  <Input
                    value={String(resolvePath(data, key) ?? '')}
                    onChange={(e) => props.onUpdateData(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : null}
          <Row gap={8}>
            <Button size="sm" variant="outline" onClick={props.onDuplicate}>{t('cards.duplicate')}</Button>
            <Button size="sm" variant="danger" onClick={props.onDelete}>{t('common.delete')}</Button>
          </Row>
        </div>
      </details>
    </div>
  );
}

function getLocalizedValue(value: any, language: 'en' | 'ar') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return String(value[language] ?? value.en ?? value.ar ?? '');
  }
  return value == null ? '' : String(value);
}

function hasLocalizedValue(value: any) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') {
    const record = value as Record<string, any>;
    return Boolean(String(record.en ?? '').trim() || String(record.ar ?? '').trim());
  }
  return Boolean(value);
}

function normalizeTemplateKey(value: any): TemplateKey {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'classic' || cleaned === 'moon' || cleaned === 'sand') return cleaned as TemplateKey;
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

function getRarityLabel(rarity: Rarity, language: 'en' | 'ar') {
  const labels = {
    common: { en: 'Common', ar: 'عادي' },
    rare: { en: 'Rare', ar: 'نادر' },
    epic: { en: 'Epic', ar: 'ملحمي' },
    legendary: { en: 'Legendary', ar: 'أسطوري' },
  } as const;
  return labels[rarity][language] ?? labels[rarity].en;
}

function isReservedColumn(key: string) {
  const reserved = [
    'name',
    'desc',
    'ability',
    'attack',
    'defense',
    'rarity',
    'template',
    'templateKey',
    'bgColor',
    'cost',
    'race',
    'traits',
    'tags',
    'stats',
    'id',
  ];
  return reserved.some((field) => key === field || key.startsWith(`${field}.`));
}
