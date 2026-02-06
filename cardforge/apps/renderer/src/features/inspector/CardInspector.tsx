import React from 'react';
import type { CardArt, DataRow, Project } from '../../../../../packages/core/src/index';
import { resolvePath } from '../../../../../packages/core/src/index';
import { useTranslation } from 'react-i18next';
import { Button, Input, Row, Select, Toggle, Badge, Divider } from '../../components/ui';
import { CARD_TEMPLATES, type TemplateKey } from '../../templates/cardTemplates';
import type { Rarity } from '../../lib/balanceRules';

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

export function CardInspector(props: Props) {
  const { t } = useTranslation();
  if (!props.row) {
    return <div className="empty">{t('cards.empty')}</div>;
  }

  const data = props.row.data ?? {};
  const art: CardArt | undefined = props.row.art ?? (data as any).art;
  const rarity = normalizeRarity(data.rarity);
  const templateKey = normalizeTemplateKey(data.templateKey ?? data.template);
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

  const customColumns = props.columns.filter((key) => !isReservedColumn(key));

  return (
    <div className="uiStack">
      <details className="uiAccordion" open>
        <summary className="uiAccordionHeader">{t('editor.inspector.card')}</summary>
        <div className="uiAccordionBody uiStack">
          <div>
            <div className="uiHelp">{t('editor.inspector.template')}</div>
            <Select
              value={templateKey}
              onChange={(e) => props.onUpdateData('templateKey', e.target.value)}
            >
              {Object.values(CARD_TEMPLATES).map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label[props.language] ?? template.label.en}
                </option>
              ))}
            </Select>
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
    'tags',
    'stats',
    'id',
  ];
  return reserved.some((field) => key === field || key.startsWith(`${field}.`));
}
