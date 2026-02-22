import { useMemo, useState } from 'react';
import type { DataRow, Project } from '../../../../packages/core/src/index';
import { useTranslation } from 'react-i18next';
import { Row, Input, Select, Button, Badge, Divider } from '../components/ui';
import { Zap, Sword, Shield, BarChart3 } from 'lucide-react';
import { useAppStore } from '../state/appStore';
import { simulate, type SimResult } from '../lib/simulator';
import type { Rarity } from '../lib/balanceRules';
import { CARD_TEMPLATES, type TemplateKey } from '../templates/cardTemplates';

type DeckFilter = {
  rarity: '' | Rarity;
  race: string;
  trait: string;
  template: string;
  tag: string;
};

type SimCard = {
  id: string;
  attack: number;
  defense: number;
  rarity: Rarity;
  abilityKey?: string;
  race?: string;
  traits?: string[];
};

const RARITY_OPTIONS: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export function SimulatorScreen(props: { project: Project }) {
  const { t, i18n } = useTranslation();
  const { activeTableId } = useAppStore();
  const { project } = props;
  const [runs, setRuns] = useState(1000);
  const [filtersA, setFiltersA] = useState<DeckFilter>({ rarity: '', race: '', trait: '', template: '', tag: '' });
  const [filtersB, setFiltersB] = useState<DeckFilter>({ rarity: '', race: '', trait: '', template: '', tag: '' });
  const [result, setResult] = useState<SimResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const dataTables = project.dataTables ?? [];
  const dataTable = dataTables.find((table) => table.id === activeTableId) ?? dataTables[0];
  const rows: DataRow[] = dataTable?.rows ?? [];

  const tagOptions = useMemo(() => collectTags(rows), [rows]);
  const templateOptions = useMemo(() => collectTemplates(rows), [rows]);
  const raceOptions = useMemo(() => collectRaces(rows), [rows]);
  const traitOptions = useMemo(() => collectTraits(rows), [rows]);

  const deckA = useMemo(() => buildDeck(rows, filtersA), [rows, filtersA]);
  const deckB = useMemo(() => buildDeck(rows, filtersB), [rows, filtersB]);

  const canRun = runs > 0 && deckA.length > 0 && deckB.length > 0;
  const previewDeckA = deckA.slice(0, 4);
  const previewDeckB = deckB.slice(0, 4);

  const handleRun = () => {
    const safeRuns = Math.max(1, Math.floor(Number(runs) || 1));
    if (safeRuns !== runs) {
      setRuns(safeRuns);
    }
    if (!deckA.length || !deckB.length) {
      setResult(null);
      return;
    }
    setIsRunning(true);
    setResult(simulate(safeRuns, deckA, deckB));
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
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

  if (!dataTable) {
    return (
      <div className="screen uiApp min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="uiPanel simPanel bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-slate-200/50">
          <div className="uiPanelHeader">
            <div>
              <div className="uiTitle">{t('simulator.title')}</div>
              <div className="uiSub">{t('simulator.subtitle')}</div>
            </div>
          </div>
          <div className="uiPanelBody simPanelBody">
            <div className="uiHelp">{t('cards.empty')}</div>
            <div className="uiHelp">{t('cards.emptyHint')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen uiApp min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <aside className="uiPanel simPanel bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-slate-200/50">
          <div className="uiPanelHeader">
            <div>
              <div className="uiTitle">{t('simulator.filters')}</div>
              <div className="uiSub">{t('simulator.subtitle')}</div>
            </div>
          </div>
          <div className="uiPanelBody simPanelBody">
            <details className="uiCollapse" open>
              <summary className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow">
                    <Zap className="h-4 w-4" />
                  </span>
                  <span>{t('simulator.deckA')}</span>
                </div>
              </summary>
              <div className="uiCollapseBody mt-3">
                <DeckFilterControls
                  filters={filtersA}
                  onChange={setFiltersA}
                  templateOptions={templateOptions}
                  tagOptions={tagOptions}
                  raceOptions={raceOptions}
                  traitOptions={traitOptions}
                  language={language}
                  rarityLabels={rarityLabels}
                  count={deckA.length}
                />
                {previewDeckA.length ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {previewDeckA.map((card, index) => (
                      <div
                        key={toKey(card.id, `deck-a-${index}`)}
                        className="rounded-xl border border-slate-200/60 bg-white/80 p-3 shadow-sm"
                      >
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">{card.rarity}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">
                          ATK {card.attack} / DEF {card.defense}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </details>
            <details className="uiCollapse" open>
              <summary className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 font-semibold">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow">
                    <Zap className="h-4 w-4" />
                  </span>
                  <span>{t('simulator.deckB')}</span>
                </div>
              </summary>
              <div className="uiCollapseBody mt-3">
                <DeckFilterControls
                  filters={filtersB}
                  onChange={setFiltersB}
                  templateOptions={templateOptions}
                  tagOptions={tagOptions}
                  raceOptions={raceOptions}
                  traitOptions={traitOptions}
                  language={language}
                  rarityLabels={rarityLabels}
                  count={deckB.length}
                />
                {previewDeckB.length ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {previewDeckB.map((card, index) => (
                      <div
                        key={toKey(card.id, `deck-b-${index}`)}
                        className="rounded-xl border border-slate-200/60 bg-white/80 p-3 shadow-sm"
                      >
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">{card.rarity}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">
                          ATK {card.attack} / DEF {card.defense}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </details>
          </div>
        </aside>

        <main className="uiPanel simPanel bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-slate-200/50">
          <div className="uiPanelHeader">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-600" />
              <div>
                <div className="uiTitle">{t('simulator.results')}</div>
                <div className="uiSub">{t('simulator.readyHint')}</div>
              </div>
            </div>
            <Row gap={8}>
              <Button
                onClick={handleRun}
                disabled={!canRun || isRunning}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white transform hover:-translate-y-1 transition-all shadow-lg"
              >
                <span className="inline-flex items-center gap-2">
                  <Sword className="h-4 w-4" />
                  {t('simulator.run')}
                </span>
              </Button>
              <Button variant="outline" onClick={handleStop} disabled={!isRunning}>
                {t('simulator.stop')}
              </Button>
            </Row>
          </div>
          <div className="uiPanelBody simPanelBody">
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
              <Divider />
              <details className="uiCollapse">
                <summary className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-4 w-4 text-slate-500" />
                  <div style={{ fontWeight: 600 }}>{t('simulator.advanced')}</div>
                </summary>
                <div className="uiCollapseBody">
                  <div className="uiHelp">{t('simulator.advancedHint')}</div>
                </div>
              </details>
            </div>
          </div>
        </main>

        <aside className="uiPanel simPanel bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-slate-200/50">
          <div className="uiPanelHeader">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-600" />
              <div>
                <div className="uiTitle">{t('simulator.details')}</div>
                <div className="uiSub">{t('simulator.title')}</div>
              </div>
            </div>
          </div>
          <div className="uiPanelBody simPanelBody">
            {result ? (
              <div className="uiStack">
                <Badge>{t('simulator.runs')}: {result.runs}</Badge>
                <Badge>{t('simulator.deckA')}: {deckA.length}</Badge>
                <Badge>{t('simulator.deckB')}: {deckB.length}</Badge>
                <Divider />
                <div className="uiHelp">{t('simulator.winRate')} A: {formatPercent(winRateA)}</div>
                <div className="uiHelp">{t('simulator.winRate')} B: {formatPercent(winRateB)}</div>
                <div className="uiHelp">{t('simulator.drawRate')}: {formatPercent(drawRate)}</div>
              </div>
            ) : (
              <div className="uiHelp">{t('simulator.readyHint')}</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function DeckFilterControls(props: {
  filters: DeckFilter;
  onChange: (next: DeckFilter) => void;
  templateOptions: string[];
  tagOptions: string[];
  raceOptions: string[];
  traitOptions: string[];
  language: 'en' | 'ar';
  rarityLabels: Record<Rarity, string>;
  count: number;
}) {
  const { t } = useTranslation();
  const { filters, onChange } = props;
  return (
    <div className="uiStack">
      <div>
        <div className="uiHelp">{t('simulator.rarity')}</div>
        <Select
          value={filters.rarity}
          onChange={(e) => onChange({ ...filters, rarity: e.target.value as DeckFilter['rarity'] })}
        >
          <option value="">{t('common.all')}</option>
          {RARITY_OPTIONS.map((rarity, index) => {
            const keyValue = toKey(rarity, `rarity-${index}`);
            return (
              <option key={keyValue} value={rarity}>
                {toDisplayText(props.rarityLabels[rarity])}
              </option>
            );
          })}
        </Select>
      </div>
      <div>
        <div className="uiHelp">{t('simulator.race')}</div>
        <Select
          value={filters.race}
          onChange={(e) => onChange({ ...filters, race: e.target.value })}
        >
          <option value="">{t('common.all')}</option>
          {props.raceOptions.map((race, index) => {
            const raceValue = toDisplayText(race);
            const keyValue = toKey(raceValue, `race-${index}`);
            return (
              <option key={keyValue} value={raceValue}>
                {t(`races.${raceValue}`, { defaultValue: raceValue })}
              </option>
            );
          })}
        </Select>
      </div>
      <div>
        <div className="uiHelp">{t('simulator.trait')}</div>
        <Select
          value={filters.trait}
          onChange={(e) => onChange({ ...filters, trait: e.target.value })}
        >
          <option value="">{t('common.all')}</option>
          {props.traitOptions.map((trait, index) => {
            const traitValue = toDisplayText(trait);
            const keyValue = toKey(traitValue, `trait-${index}`);
            return (
              <option key={keyValue} value={traitValue}>
                {t(`traits.${traitValue}`, { defaultValue: traitValue })}
              </option>
            );
          })}
        </Select>
      </div>
      <details className="uiCollapse">
        <summary>
          <div style={{ fontWeight: 600 }}>{t('simulator.advanced')}</div>
        </summary>
        <div className="uiCollapseBody uiStack">
          <div>
            <div className="uiHelp">{t('simulator.template')}</div>
            <Select
              value={filters.template}
              onChange={(e) => onChange({ ...filters, template: e.target.value })}
            >
              <option value="">{t('common.all')}</option>
              {props.templateOptions.map((key, index) => {
                const templateKey = toDisplayText(key);
                const keyValue = toKey(templateKey, `template-${index}`);
                return (
                  <option key={keyValue} value={templateKey}>
                    {toDisplayText(getTemplateLabel(templateKey, props.language))}
                  </option>
                );
              })}
            </Select>
          </div>
          <div>
            <div className="uiHelp">{t('simulator.tag')}</div>
            <Select
              value={filters.tag}
              onChange={(e) => onChange({ ...filters, tag: e.target.value })}
            >
              <option value="">{t('common.all')}</option>
              {props.tagOptions.map((tag, index) => {
                const tagValue = toDisplayText(tag);
                const keyValue = toKey(tagValue, `tag-${index}`);
                return (
                  <option key={keyValue} value={tagValue}>
                    {tagValue}
                  </option>
                );
              })}
            </Select>
          </div>
        </div>
      </details>
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
  if (filters.race) {
    const race = normalizeRace(data.race);
    if (race !== filters.race) return false;
  }
  if (filters.trait) {
    const traits = normalizeTraits(data.traits ?? data.trait);
    if (!traits.includes(filters.trait)) return false;
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
  const race = normalizeRace(data.race);
  const traits = normalizeTraits(data.traits ?? data.trait);
  return {
    id: row.id,
    attack,
    defense,
    rarity,
    abilityKey: data.ability_id ?? data.abilityKey,
    race: race || undefined,
    traits: traits.length ? traits : undefined,
  };
}

function normalizeNumber(value: any) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(toDisplayText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDisplayText(value: any) {
  if (value == null) return '';
  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return String(value);
  }
  if (valueType === 'object') {
    const candidate =
      value.label ??
      value.name ??
      value.key ??
      value.id ??
      value.value;
    const candidateType = typeof candidate;
    if (candidateType === 'string' || candidateType === 'number' || candidateType === 'boolean') {
      return String(candidate);
    }
    return '';
  }
  try {
    return String(value);
  } catch {
    return '';
  }
}

function toKey(value: any, fallback: string) {
  const text = toDisplayText(value).trim();
  return text ? text : fallback;
}

function normalizeRarity(value: any): Rarity {
  const cleaned = toDisplayText(value).toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned;
  return 'common';
}

function normalizeRace(value: any) {
  return toDisplayText(value).toLowerCase().trim();
}

function normalizeTraits(value: any) {
  if (Array.isArray(value)) {
    return value.map((trait) => toDisplayText(trait).toLowerCase().trim()).filter(Boolean);
  }
  const raw = toDisplayText(value).trim();
  if (!raw) return [];
  return raw
    .split(/[,|]/g)
    .map((trait) => trait.trim().toLowerCase())
    .filter(Boolean);
}

function resolveTemplate(data: Record<string, any>) {
  const raw = data.templateKey ?? data.template ?? data.template_key;
  return toDisplayText(raw).toLowerCase().trim();
}

function extractTags(data: Record<string, any>) {
  const raw = data.tags ?? data.tag;
  if (Array.isArray(raw)) {
    return raw.map((tag) => toDisplayText(tag).trim()).filter(Boolean);
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

function collectRaces(rows: DataRow[]) {
  const set = new Set<string>();
  rows.forEach((row) => {
    const race = normalizeRace((row.data ?? {}).race);
    if (race) set.add(race);
  });
  return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

function collectTraits(rows: DataRow[]) {
  const set = new Set<string>();
  rows.forEach((row) => {
    normalizeTraits((row.data ?? {}).traits ?? (row.data ?? {}).trait).forEach((trait) => set.add(trait));
  });
  return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
}

function getTemplateLabel(key: string, language: 'en' | 'ar') {
  const template = CARD_TEMPLATES[key as TemplateKey];
  if (!template) return key;
  return template.label[language] ?? template.label.en;
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}
