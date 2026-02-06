import React, { useMemo, useState } from 'react';
import type { DataRow, Project } from '../../../../packages/core/src/index';
import { useTranslation } from 'react-i18next';
import { Panel, Row, Input, Select, Button, Badge, Divider } from '../components/ui';
import { useAppStore } from '../state/appStore';
import { simulate } from '../lib/simulator';
import type { Rarity } from '../lib/balanceRules';
import { CARD_TEMPLATES, type TemplateKey } from '../templates/cardTemplates';

type DeckFilter = {
  rarity: '' | Rarity;
  template: string;
  tag: string;
};

type SimCard = {
  id: string;
  attack: number;
  defense: number;
  rarity: Rarity;
  abilityKey?: string;
};

const RARITY_OPTIONS: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export function SimulatorScreen(props: { project: Project }) {
  const { t, i18n } = useTranslation();
  const { activeTableId } = useAppStore();
  const { project } = props;
  const [runs, setRuns] = useState(1000);
  const [filtersA, setFiltersA] = useState<DeckFilter>({ rarity: '', template: '', tag: '' });
  const [filtersB, setFiltersB] = useState<DeckFilter>({ rarity: '', template: '', tag: '' });
  const [result, setResult] = useState<{ runs: number; p1Wins: number; p2Wins: number; draws: number } | null>(null);

  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const dataTable = project.dataTables.find((table) => table.id === activeTableId) ?? project.dataTables[0];
  const rows: DataRow[] = dataTable?.rows ?? [];

  const tagOptions = useMemo(() => collectTags(rows), [rows]);
  const templateOptions = useMemo(() => collectTemplates(rows), [rows]);

  const deckA = useMemo(() => buildDeck(rows, filtersA), [rows, filtersA]);
  const deckB = useMemo(() => buildDeck(rows, filtersB), [rows, filtersB]);

  const canRun = runs > 0 && deckA.length > 0 && deckB.length > 0;

  const handleRun = () => {
    const safeRuns = Math.max(1, Math.floor(Number(runs) || 1));
    if (safeRuns !== runs) {
      setRuns(safeRuns);
    }
    if (!deckA.length || !deckB.length) {
      setResult(null);
      return;
    }
    setResult(simulate(safeRuns, deckA, deckB));
  };

  const winRateA = result ? (result.p1Wins / result.runs) * 100 : 0;
  const winRateB = result ? (result.p2Wins / result.runs) * 100 : 0;
  const drawRate = result ? (result.draws / result.runs) * 100 : 0;

  const rarityLabels: Record<Rarity, string> = {
    common: t('editor.inspector.rarityCommon'),
    rare: t('editor.inspector.rarityRare'),
    epic: t('editor.inspector.rarityEpic'),
    legendary: t('editor.inspector.rarityLegendary'),
  };

  return (
    <div className="screen uiApp" style={{ padding: 16 }}>
      <div className="uiStack">
        <Panel title={t('simulator.title')} subtitle={t('simulator.subtitle')}>
          <div className="uiStack">
            <Row gap={10} align="end">
              <div style={{ minWidth: 160 }}>
                <div className="uiHelp">{t('simulator.runs')}</div>
                <Input
                  type="number"
                  min={1}
                  value={runs}
                  onChange={(e) => setRuns(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <Button onClick={handleRun} disabled={!canRun}>
                {t('simulator.run')}
              </Button>
            </Row>
            {result ? (
              <div className="uiRow">
                <Badge variant={winRateA >= winRateB ? 'good' : undefined}>
                  {t('simulator.winRate')} A: {formatPercent(winRateA)}
                </Badge>
                <Badge variant={winRateB > winRateA ? 'good' : undefined}>
                  {t('simulator.winRate')} B: {formatPercent(winRateB)}
                </Badge>
                <Badge>{t('simulator.drawRate')}: {formatPercent(drawRate)}</Badge>
              </div>
            ) : (
              <div className="uiHelp">{t('simulator.readyHint')}</div>
            )}
          </div>
        </Panel>

        <div className="uiGrid two">
          <Panel title={t('simulator.deckA')}>
            <DeckFilterControls
              filters={filtersA}
              onChange={setFiltersA}
              templateOptions={templateOptions}
              tagOptions={tagOptions}
              language={language}
              rarityLabels={rarityLabels}
              count={deckA.length}
            />
          </Panel>
          <Panel title={t('simulator.deckB')}>
            <DeckFilterControls
              filters={filtersB}
              onChange={setFiltersB}
              templateOptions={templateOptions}
              tagOptions={tagOptions}
              language={language}
              rarityLabels={rarityLabels}
              count={deckB.length}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function DeckFilterControls(props: {
  filters: DeckFilter;
  onChange: (next: DeckFilter) => void;
  templateOptions: string[];
  tagOptions: string[];
  language: 'en' | 'ar';
  rarityLabels: Record<Rarity, string>;
  count: number;
}) {
  const { t } = useTranslation();
  const { filters, onChange } = props;
  return (
    <div className="uiStack">
      <div className="uiRow">
        <div style={{ minWidth: 180 }}>
          <div className="uiHelp">{t('simulator.rarity')}</div>
          <Select
            value={filters.rarity}
            onChange={(e) => onChange({ ...filters, rarity: e.target.value as DeckFilter['rarity'] })}
          >
            <option value="">{t('common.all')}</option>
            {RARITY_OPTIONS.map((rarity) => (
              <option key={rarity} value={rarity}>
                {props.rarityLabels[rarity]}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ minWidth: 200 }}>
          <div className="uiHelp">{t('simulator.template')}</div>
          <Select
            value={filters.template}
            onChange={(e) => onChange({ ...filters, template: e.target.value })}
          >
            <option value="">{t('common.all')}</option>
            {props.templateOptions.map((key) => (
              <option key={key} value={key}>
                {getTemplateLabel(key, props.language)}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ minWidth: 180 }}>
          <div className="uiHelp">{t('simulator.tag')}</div>
          <Select
            value={filters.tag}
            onChange={(e) => onChange({ ...filters, tag: e.target.value })}
          >
            <option value="">{t('common.all')}</option>
            {props.tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Divider />
      <div className="uiRow">
        <Badge>{t('simulator.cards', { count: props.count })}</Badge>
        {props.count === 0 ? <span className="uiHelp">{t('simulator.emptyDeck')}</span> : null}
      </div>
    </div>
  );
}

function buildDeck(rows: DataRow[], filters: DeckFilter): SimCard[] {
  return rows
    .filter((row) => matchesFilters(row, filters))
    .map((row) => rowToCard(row))
    .filter((card): card is SimCard => Boolean(card));
}

function matchesFilters(row: DataRow, filters: DeckFilter) {
  const data = row.data ?? {};
  if (filters.rarity) {
    const rarity = normalizeRarity(data.rarity);
    if (rarity !== filters.rarity) return false;
  }
  if (filters.template) {
    const template = resolveTemplate(data);
    if (template !== filters.template) return false;
  }
  if (filters.tag) {
    const tags = extractTags(data);
    if (!tags.includes(filters.tag)) return false;
  }
  return true;
}

function rowToCard(row: DataRow): SimCard | null {
  const data = row.data ?? {};
  const attack = normalizeNumber(data.attack ?? data.stats?.attack);
  const defense = normalizeNumber(data.defense ?? data.stats?.defense);
  const rarity = normalizeRarity(data.rarity);
  return {
    id: row.id,
    attack,
    defense,
    rarity,
    abilityKey: data.ability_id ?? data.abilityKey,
  };
}

function normalizeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRarity(value: any): Rarity {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned;
  return 'common';
}

function resolveTemplate(data: Record<string, any>) {
  const raw = data.templateKey ?? data.template ?? data.template_key;
  return String(raw || '').toLowerCase().trim();
}

function extractTags(data: Record<string, any>) {
  const raw = data.tags ?? data.tag;
  if (Array.isArray(raw)) {
    return raw.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function collectTags(rows: DataRow[]) {
  const set = new Set<string>();
  rows.forEach((row) => {
    extractTags(row.data ?? {}).forEach((tag) => set.add(tag));
  });
  return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

function collectTemplates(rows: DataRow[]) {
  const set = new Set<string>();
  rows.forEach((row) => {
    const key = resolveTemplate(row.data ?? {});
    if (key) set.add(key);
  });
  if (!set.size) {
    Object.keys(CARD_TEMPLATES).forEach((key) => set.add(key));
  }
  return Array.from(set.values());
}

function getTemplateLabel(key: string, language: 'en' | 'ar') {
  const template = CARD_TEMPLATES[key as TemplateKey];
  if (!template) return key;
  return template.label[language] ?? template.label.en;
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}
