import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Blueprint, CardArt, DataRow, DataTable, ElementModel, Project } from '../../../../../packages/core/src/index';
import { createId, resolvePath } from '../../../../../packages/core/src/index';
import { getParentPath } from '../../../../../packages/storage/src/index';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Divider, Input, Row, Select, Toggle } from '../../components/ui';
import { parseCsvFile, parseXlsxFile, mapRowsToCards } from '../../lib/bulkImport';
import { captureVideoPoster, captureVideoPosterFromUrl } from '../../lib/videoPoster';
import {
  copyImageToProjectAssets,
  fileUrlToPath,
  getImageBindingDefaults,
  isAssetsPath,
  isFileUrl,
  isRemoteOrData,
  resolveImageReference,
  resolveImageReferenceSync,
} from '../../utils/imageBinding';
import { generateAdvancedStats } from '../../lib/advancedBalance';
import { createDefaultRangesConfig, generateDeck } from '../../lib/deckGenerator';
import { type AbilityKey } from '../../lib/abilityRegistry';
import type { Rarity } from '../../lib/balanceRules';
import { CARD_TEMPLATES, type TemplateKey } from '../../templates/cardTemplates';
import { AppShell } from '../../ui/layout/AppShell';
import { CardList, filterCards, type CardFilters } from '../cards/CardList';
import { CardPreviewPanel } from '../preview/CardPreviewPanel';
import { CardInspector } from '../inspector/CardInspector';
import { Dialog } from '../../ui/Dialog';

const RARITY_OPTIONS: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const ABILITY_OPTIONS: AbilityKey[] = [
  'none',
  'shield_loss_to_draw',
  'predict_two_rounds',
  'double_on_win',
  'steal_attack',
  'heal_defense',
];

type ImportSummary = {
  created: number;
  updated: number;
  errors: number;
  warnings: number;
};

type CopySummary = {
  missing: number;
  failed: number;
};

export function DataTableScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { t, i18n } = useTranslation();
  const { project, onChange } = props;
  const {
    activeBlueprintId,
    activeTableId,
    previewRowId,
    setPreviewRowId,
    setActiveTableId,
    setScreen,
  } = useAppStore();

  const [filters, setFilters] = useState<CardFilters>({ query: '', rarity: '', template: '', tag: '' });
  const [defaultTemplate, setDefaultTemplate] = useState<TemplateKey>('classic');
  const [mergeById, setMergeById] = useState(false);
  const [hasLanguageColumns, setHasLanguageColumns] = useState(true);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [deckSize, setDeckSize] = useState(40);
  const [dist, setDist] = useState({ common: 60, rare: 25, epic: 10, legendary: 5 });
  const [deckAutoBalanced, setDeckAutoBalanced] = useState(false);
  const [advancedBalance, setAdvancedBalance] = useState(false);
  const [rangesConfig, setRangesConfig] = useState(() => createDefaultRangesConfig());
  const [defaultCost, setDefaultCost] = useState(1);
  const [defaultAbility, setDefaultAbility] = useState<AbilityKey>('none');
  const [showVideoControls, setShowVideoControls] = useState(false);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [copySummary, setCopySummary] = useState<CopySummary | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const language = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const table = project.dataTables.find((tbl) => tbl.id === activeTableId) ?? project.dataTables[0];
  const blueprint: Blueprint | undefined =
    project.blueprints.find((bp) => bp.id === activeBlueprintId) ?? project.blueprints[0];
  const rows: DataRow[] = table?.rows ?? [];
  const columns = useMemo(() => {
    if (!table) return [];
    if (table.columns?.length) return table.columns;
    return collectColumns(rows.map((row) => row.data ?? {}));
  }, [rows, table]);

  const imageBinding = getImageBindingDefaults(table?.imageBinding);
  const bindingElements: ElementModel[] =
    blueprint?.elements.filter((el) => el.type === 'text' || el.type === 'image') ?? [];

  const tagOptions = useMemo(() => collectTags(rows), [rows]);
  const templateOptions = useMemo(() => collectTemplates(rows), [rows]);
  const filteredRows = useMemo(() => filterCards(rows, filters, language), [rows, filters, language]);
  const selectedRow = rows.find((row) => row.id === previewRowId) ?? rows[0];
  const pendingRow = pendingDeleteId ? rows.find((row) => row.id === pendingDeleteId) : undefined;

  useEffect(() => {
    if (!rows.length) {
      if (previewRowId) setPreviewRowId(undefined);
      return;
    }
    if (!previewRowId || !rows.find((row) => row.id === previewRowId)) {
      setPreviewRowId(rows[0].id);
    }
  }, [rows, previewRowId, setPreviewRowId]);

  const previewArt = useMemo(() => {
    if (!selectedRow) return undefined;
    if (selectedRow.art && isCardArt(selectedRow.art)) return selectedRow.art;
    const dataArt = (selectedRow.data as any)?.art;
    if (isCardArt(dataArt)) return dataArt;
    if (!imageBinding.column) return undefined;
    const raw = resolvePath(selectedRow.data ?? {}, imageBinding.column);
    const resolved = resolveImageReferenceSync(raw, imageBinding);
    if (!resolved) return undefined;
    return { kind: 'image', src: resolved } as CardArt;
  }, [selectedRow, imageBinding]);

  const previewRow = selectedRow && previewArt && selectedRow.art !== previewArt
    ? { ...selectedRow, art: previewArt }
    : selectedRow;

  const posterWarning = previewArt?.kind === 'video' && !previewArt.poster ? t('data.posterRequired') : undefined;

  const updateTable = (nextTable: DataTable) => {
    const exists = project.dataTables.some((tbl) => tbl.id === nextTable.id);
    const tables = project.dataTables.length
      ? exists
        ? project.dataTables.map((tbl) => (tbl.id === nextTable.id ? nextTable : tbl))
        : [...project.dataTables, nextTable]
      : [nextTable];
    const fallback = (rowId: string) => t('project.itemFallback', { id: rowId });
    const items = tables.flatMap((tbl) => buildItemsFromTable(tbl, project, blueprint, fallback));
    onChange({ ...project, dataTables: tables, items });
    setActiveTableId(nextTable.id);
  };

  const updateRows = (nextRows: DataRow[]) => {
    if (!table) return;
    const nextTable = { ...table, rows: nextRows, columns: collectColumns(nextRows.map((row) => row.data ?? {})) };
    updateTable(nextTable);
  };

  const updateRowData = (rowId: string, path: string, value: any) => {
    if (!table) return;
    const nextRows = table.rows.map((row) =>
      row.id === rowId ? { ...row, data: setPathValue(row.data ?? {}, path, value) } : row,
    );
    updateRows(nextRows);
  };

  const updateRowStats = (rowId: string, key: 'attack' | 'defense', value: number) => {
    if (!table) return;
    const nextRows = table.rows.map((row) => {
      if (row.id !== rowId) return row;
      const data = row.data ?? {};
      const stats = { ...(data.stats ?? {}), [key]: value };
      return {
        ...row,
        data: {
          ...data,
          [key]: value,
          stats,
        },
      };
    });
    updateRows(nextRows);
  };

  const updateRowMeta = (rowId: string, patch: Partial<DataRow>) => {
    if (!table) return;
    const nextRows = table.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    updateRows(nextRows);
  };

  const updateRowArt = (rowId: string, art?: CardArt) => {
    if (!table) return;
    const nextRows = table.rows.map((row) => (row.id === rowId ? { ...row, art } : row));
    updateRows(nextRows);
  };

  const addRow = () => {
    const nextRow: DataRow = {
      id: createId('row'),
      data: {},
      quantity: 1,
      setId: project.sets[0]?.id,
      blueprintId: blueprint?.id,
    };
    const nextTable: DataTable = table
      ? { ...table, rows: [...table.rows, nextRow] }
      : { id: createId('table'), name: t('data.mainTable'), columns: [], rows: [nextRow] };
    updateTable(nextTable);
    setPreviewRowId(nextRow.id);
  };

  const removeRow = (rowId: string) => {
    if (!table) return;
    const nextRows = table.rows.filter((row) => row.id !== rowId);
    updateRows(nextRows);
    if (previewRowId === rowId && nextRows.length) {
      setPreviewRowId(nextRows[0].id);
    }
  };

  const requestDelete = (rowId?: string) => {
    if (!rowId) return;
    setPendingDeleteId(rowId);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (pendingDeleteId) {
      removeRow(pendingDeleteId);
    }
    setConfirmDeleteOpen(false);
    setPendingDeleteId(null);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
    setPendingDeleteId(null);
  };

  const duplicateRow = (rowId: string) => {
    if (!table) return;
    const source = table.rows.find((row) => row.id === rowId);
    if (!source) return;
    const existingIds = new Set(table.rows.map((row) => row.id));
    const nextId = ensureUniqueRowId(source.id, existingIds);
    const nextRow: DataRow = {
      ...source,
      id: nextId,
      data: { ...(source.data ?? {}), id: nextId },
    };
    updateRows([...table.rows, nextRow]);
    setPreviewRowId(nextId);
  };

  const updateBinding = (elementId: string, column: string) => {
    if (!blueprint) return;
    const nextBlueprint = {
      ...blueprint,
      elements: blueprint.elements.map((el) => (el.id === elementId ? { ...el, bindingKey: column } : el)),
    };
    const nextProject = {
      ...project,
      blueprints: project.blueprints.map((bp) => (bp.id === blueprint.id ? nextBlueprint : bp)),
    };
    onChange(nextProject);
  };

  const updateImageBinding = (patch: Partial<typeof imageBinding>) => {
    if (!table) return;
    const nextTable = { ...table, imageBinding: { ...imageBinding, ...patch } };
    updateTable(nextTable);
  };

  const pickImagesFolder = async () => {
    if (!window.cardsmith) return;
    const res = await window.cardsmith.selectImagesFolder();
    if (res.canceled || !res.filePaths?.[0]) return;
    updateImageBinding({ imagesFolder: res.filePaths[0] });
  };

  const pickPlaceholder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file, t('editor.errors.readImage'));
        updateImageBinding({ placeholder: dataUrl });
      } catch {
        alert(t('editor.errors.readImage'));
      }
    };
    input.click();
  };

  const copyImagesToAssets = async () => {
    if (!table) return;
    if (!window.cardsmith) return;
    if (!project.meta.filePath) {
      alert(t('data.copyRequiresSave'));
      return;
    }
    if (!imageBinding.column) return;

    const root = getParentPath(project.meta.filePath);
    const existingNames = new Set((project.assets?.images ?? []).map((asset) => asset.name.toLowerCase()));
    const nextAssets = [...(project.assets?.images ?? [])];
    const nextRows = [...table.rows];
    let missing = 0;
    let failed = 0;

    for (let i = 0; i < nextRows.length; i += 1) {
      const row = nextRows[i];
      const raw = resolvePath(row.data ?? {}, imageBinding.column);
      if (isCardArt(raw) && raw.kind === 'video') {
        continue;
      }
      const result = await resolveImageReference(raw, imageBinding, root);
      if (result.missing || !result.resolved) {
        missing += 1;
        continue;
      }
      if (isRemoteOrData(result.resolved) || isAssetsPath(result.resolved)) {
        continue;
      }
      const sourcePath = isFileUrl(result.resolved) ? fileUrlToPath(result.resolved) : result.resolved;
      const copyResult = await copyImageToProjectAssets(sourcePath, root, existingNames);
      if (!copyResult.relativePath) {
        failed += 1;
        continue;
      }
      nextAssets.push({
        id: createId('asset'),
        name: getFileName(copyResult.relativePath),
        src: copyResult.relativePath,
        size: copyResult.size ?? 0,
        addedAt: new Date().toISOString(),
      });
      nextRows[i] = {
        ...row,
        data: setPathValue(row.data ?? {}, imageBinding.column, copyResult.relativePath),
      };
    }

    setCopySummary({ missing, failed });
    const updatedTable: DataTable = { ...table, rows: nextRows };
    const exists = project.dataTables.some((tbl) => tbl.id === updatedTable.id);
    const tables = project.dataTables.length
      ? exists
        ? project.dataTables.map((tbl) => (tbl.id === updatedTable.id ? updatedTable : tbl))
        : [...project.dataTables, updatedTable]
      : [updatedTable];
    const fallback = (rowId: string) => t('project.itemFallback', { id: rowId });
    const items = tables.flatMap((tbl) => buildItemsFromTable(tbl, project, blueprint, fallback));
    onChange({ ...project, dataTables: tables, items, assets: { images: nextAssets } });
    setActiveTableId(updatedTable.id);
  };

  const pickArtImage = () => {
    if (!selectedRow) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file, t('editor.errors.readImage'));
        updateRowArt(selectedRow.id, { kind: 'image', src: dataUrl });
      } catch {
        alert(t('editor.errors.readImage'));
      }
    };
    input.click();
  };

  const pickArtVideo = () => {
    if (!selectedRow) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const poster = await captureVideoPoster(file);
        const src = URL.createObjectURL(file);
        updateRowArt(selectedRow.id, { kind: 'video', src, poster });
      } catch (err: any) {
        alert(err?.message ?? t('data.videoPosterFailed'));
      }
    };
    input.click();
  };

  const regeneratePoster = async () => {
    if (!selectedRow?.art || selectedRow.art.kind !== 'video') return;
    try {
      const poster = await captureVideoPosterFromUrl(selectedRow.art.src);
      updateRowArt(selectedRow.id, { ...selectedRow.art, poster });
    } catch (err: any) {
      alert(err?.message ?? t('data.videoPosterFailed'));
    }
  };

  const handleImport = async (file: File, mode: 'csv' | 'xlsx') => {
    const parsed = mode === 'csv' ? await parseCsvFile(file) : await parseXlsxFile(file);
    const { cards, errors } = mapRowsToCards(parsed, { defaultTemplate, hasLanguageColumns });
    const existingIds = new Set(rows.map((row) => row.id));
    const rowIndex = new Map(rows.map((row, index) => [row.id, index]));
    const nextRows = [...rows];
    let created = 0;
    let updated = 0;
    let warnings = 0;

    cards.forEach((card) => {
      warnings += card.warnings?.length ?? 0;
      const setId = findSetIdByName(project, card.setName ?? '');
      if (mergeById && rowIndex.has(card.id)) {
        const index = rowIndex.get(card.id) ?? 0;
        const existing = nextRows[index];
        nextRows[index] = {
          ...existing,
          data: { ...(existing.data ?? {}), ...card.data, id: card.id },
          art: card.art ?? existing.art,
          quantity: card.quantity ?? existing.quantity ?? 1,
          setId: setId ?? existing.setId,
        };
        updated += 1;
        return;
      }

      const nextId = ensureUniqueRowId(card.id, existingIds);
      nextRows.push({
        id: nextId,
        data: { ...card.data, id: nextId },
        art: card.art,
        quantity: card.quantity ?? 1,
        setId,
        blueprintId: blueprint?.id,
      });
      created += 1;
    });

    const nextTable: DataTable = table
      ? { ...table, rows: nextRows, columns: collectColumns(nextRows.map((row) => row.data ?? {})) }
      : { id: createId('table'), name: t('data.mainTable'), columns: collectColumns(nextRows.map((row) => row.data ?? {})), rows: nextRows };
    updateTable(nextTable);
    setImportSummary({ created, updated, errors: errors.length, warnings });
    if (errors.length) {
      alert(errors.join('\n'));
    }
  };

  const pickImport = (accept: string, mode: 'csv' | 'xlsx') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      handleImport(file, mode);
    };
    input.click();
  };

  const handleGenerateDeck = () => {
    const safeSize = Math.max(1, Math.floor(Number(deckSize) || 1));
    if (safeSize !== deckSize) setDeckSize(safeSize);
    const templates = Object.keys(CARD_TEMPLATES);
    const result = generateDeck({
      size: safeSize,
      distribution: dist,
      templates,
      lang: language,
      advancedBalance,
      cost: defaultCost,
      abilityKey: defaultAbility,
      rangesConfig,
    });

    const existingIds = new Set(rows.map((row) => row.id));
    const nextRows = [...rows];
    result.cards.forEach((card) => {
      const nextId = ensureUniqueRowId(card.id, existingIds);
      nextRows.push({
        id: nextId,
        data: { ...card.data, id: nextId },
        quantity: 1,
        setId: project.sets[0]?.id,
        blueprintId: blueprint?.id,
      });
    });

    const nextTable: DataTable = table
      ? { ...table, rows: nextRows, columns: collectColumns(nextRows.map((row) => row.data ?? {})) }
      : { id: createId('table'), name: t('data.mainTable'), columns: collectColumns(nextRows.map((row) => row.data ?? {})), rows: nextRows };
    updateTable(nextTable);
    setDeckAutoBalanced(result.autoBalanced);
    setImportSummary(null);
    if (result.cards.length) {
      setPreviewRowId(nextRows[nextRows.length - 1]?.id);
    }
  };

  const total = dist.common + dist.rare + dist.epic + dist.legendary;
  const totalDisplay = Math.round(total);
  const zeroRarity = Object.values(dist).some((value) => Number(value) === 0);
  const enabledRarities = rangesConfig.enabled
    ? RARITY_OPTIONS.filter((rarity) => rangesConfig.perRarity[rarity]?.enabled)
    : RARITY_OPTIONS;
  const enabledTotal = enabledRarities.reduce((sum, rarity) => sum + Number(dist[rarity] || 0), 0);
  const rangesZeroWarning = rangesConfig.enabled && Math.round(enabledTotal) === 0;
  const balancePreview = useMemo(() => {
    if (!advancedBalance) return null;
    return generateAdvancedStats({ rarity: 'rare', cost: defaultCost, abilityKey: defaultAbility });
  }, [advancedBalance, defaultCost, defaultAbility]);
  const clampRangeValue = (value: number) => Math.max(0, Math.min(999, Math.floor(Number(value) || 0)));
  const updateRangeValue = (rarity: Rarity, field: 'attack' | 'defense' | 'cost', bound: 'min' | 'max', value: number) => {
    setRangesConfig((prev) => {
      const current = prev.perRarity[rarity];
      const nextRange = { ...(current[field] ?? { min: 0, max: 0 }) };
      nextRange[bound] = clampRangeValue(value);
      if (nextRange.max < nextRange.min) {
        const swap = nextRange.min;
        nextRange.min = nextRange.max;
        nextRange.max = swap;
      }
      return {
        ...prev,
        perRarity: {
          ...prev.perRarity,
          [rarity]: {
            ...current,
            [field]: nextRange,
          },
        },
      };
    });
  };
  const updateRangeToggle = (rarity: Rarity, enabled: boolean) => {
    setRangesConfig((prev) => ({
      ...prev,
      perRarity: {
        ...prev.perRarity,
        [rarity]: {
          ...prev.perRarity[rarity],
          enabled,
        },
      },
    }));
  };
  const normalizeDistribution = () => {
    if (total <= 0) {
      setDist({ common: 60, rare: 25, epic: 10, legendary: 5 });
      return;
    }
    const scaled = {
      common: Math.round((dist.common / total) * 100),
      rare: Math.round((dist.rare / total) * 100),
      epic: Math.round((dist.epic / total) * 100),
      legendary: Math.round((dist.legendary / total) * 100),
    };
    const sum = scaled.common + scaled.rare + scaled.epic + scaled.legendary;
    const remainder = 100 - sum;
    if (remainder !== 0) {
      const entries = Object.entries(scaled) as Array<[keyof typeof scaled, number]>;
      const largest = entries.reduce((prev, current) => (current[1] > prev[1] ? current : prev), entries[0]);
      scaled[largest[0]] = scaled[largest[0]] + remainder;
    }
    setDist(scaled);
  };
  const header = (
    <div className="topBarContent">
      <div className="topBarGroup">
        <Button
          size="sm"
          variant="outline"
          className="onlySmallLeft"
          onClick={() => setLeftDrawerOpen(true)}
        >
          {t('cards.title')}
        </Button>
        <div>
          <div className="uiTitle">{t('cards.title')}</div>
          <div className="uiSub">{t('cards.count', { count: filteredRows.length })}</div>
        </div>
      </div>
      <div className="topBarGroup">
        <Button size="sm" variant="outline" onClick={addRow}>{t('data.addRow')}</Button>
        <Button size="sm" variant="outline" onClick={() => pickImport('.csv,text/csv', 'csv')}>{t('data.importCsv')}</Button>
        <Button size="sm" variant="outline" onClick={() => pickImport('.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx')}>
          {t('data.importXlsx')}
        </Button>
        <Button size="sm" onClick={handleGenerateDeck}>{t('data.generateDeck')}</Button>
      </div>
      <div className="topBarGroup">
        <Button size="sm" variant="outline" onClick={() => setScreen('export')}>
          {t('app.nav.export')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setScreen('simulator')}>
          {t('app.nav.simulator')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="onlySmallRight"
          onClick={() => setRightDrawerOpen(true)}
        >
          {t('cards.openInspector')}
        </Button>
      </div>
    </div>
  );

  const leftPanel = (
    <div className="panelShell">
      <div className="panelHeaderSticky uiPanelHeader">
        <div>
          <div className="uiTitle">{t('cards.title')}</div>
          <div className="uiSub">{t('cards.count', { count: filteredRows.length })}</div>
        </div>
        <Button size="sm" variant="outline" className="panelClose" onClick={() => setLeftDrawerOpen(false)}>
          {t('common.close')}
        </Button>
      </div>
      <div className="panelScroll uiPanelBody">
        <ToolSection title={t('cards.filters')} defaultOpen>
          <div className="uiStack">
            <Input
              placeholder={t('cards.search')}
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            />
            <Select
              value={filters.rarity}
              onChange={(e) => setFilters({ ...filters, rarity: e.target.value as CardFilters['rarity'] })}
            >
              <option value="">{t('common.all')}</option>
              {RARITY_OPTIONS.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {t(`editor.inspector.rarity${rarity[0].toUpperCase()}${rarity.slice(1)}`)}
                </option>
              ))}
            </Select>
            <Select
              value={filters.template}
              onChange={(e) => setFilters({ ...filters, template: e.target.value })}
            >
              <option value="">{t('common.all')}</option>
              {templateOptions.map((template) => (
                <option key={template} value={template}>
                  {CARD_TEMPLATES[template as TemplateKey]?.label[language] ?? template}
                </option>
              ))}
            </Select>
            <Select
              value={filters.tag}
              onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            >
              <option value="">{t('common.all')}</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Select>
          </div>
        </ToolSection>
        <Divider />
        <CardList
          cards={rows}
          selectedId={selectedRow?.id}
          onSelect={(id) => {
            setPreviewRowId(id);
            setLeftDrawerOpen(false);
          }}
          filters={filters}
          language={language}
        />
        <Divider />
        <div className="uiTitle" style={{ fontSize: 14 }}>{t('cards.tools')}</div>
        <div className="uiStack" style={{ marginTop: 10 }}>
          <ToolSection title={t('ui.bulkImport.title')} subtitle={t('ui.bulkImport.sub')} defaultOpen>
            <div className="uiStack">
              <Row gap={8}>
                <Button size="sm" onClick={() => pickImport('.csv,text/csv', 'csv')}>{t('data.importCsv')}</Button>
                <Button size="sm" variant="outline" onClick={() => pickImport('.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx')}>
                  {t('data.importXlsx')}
                </Button>
              </Row>
              <div>
                <div className="uiHelp">{t('data.defaultTemplate')}</div>
                <Select value={defaultTemplate} onChange={(e) => setDefaultTemplate(e.target.value as TemplateKey)}>
                  {Object.values(CARD_TEMPLATES).map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.label[language] ?? template.label.en}
                    </option>
                  ))}
                </Select>
              </div>
              <Toggle checked={mergeById} onChange={setMergeById} label={t('data.mergeById')} />
              <Toggle checked={hasLanguageColumns} onChange={setHasLanguageColumns} label={t('data.languageColumns')} />
              <div className="uiHelp">{t('ui.tip.mergeById')}</div>
              {importSummary ? (
                <Badge variant={importSummary.errors || importSummary.warnings ? 'warn' : 'good'}>
                  {t('data.importSummary', importSummary)}
                </Badge>
              ) : null}
            </div>
          </ToolSection>

          <ToolSection title={t('ui.deckGen.title')} subtitle={t('ui.deckGen.sub')} defaultOpen>
            <div className="uiStack">
              <Row gap={10} align="end">
                <div style={{ minWidth: 140 }}>
                  <div className="uiHelp">{t('data.deckSize')}</div>
                  <Input
                    type="number"
                    min={1}
                    value={deckSize}
                    onChange={(e) => setDeckSize(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
                <Button onClick={handleGenerateDeck}>{t('data.generateDeck')}</Button>
              </Row>
              <div className="uiRow" style={{ justifyContent: 'space-between' }}>
                <div className="uiStack" style={{ gap: 6 }}>
                  <div className="uiTitle">{t('cards.deck.title')}</div>
                  <div className="uiSub">{t('cards.deck.sub')}</div>
                </div>
                <div className="uiRow">
                  <span className={totalDisplay === 100 ? 'uiBadge uiBadgeGood' : 'uiBadge uiBadgeWarn'}>
                    {t('cards.deck.total')}: {totalDisplay}%
                  </span>
                  <button className="uiBtn" type="button" onClick={normalizeDistribution}>
                    {t('cards.deck.normalize')}
                  </button>
                </div>
              </div>
              <div className="rarityGrid">
                <div className="rarityField">
                  <div className="rarityLabel">
                    <div className="name">{t('cards.rarity.common')}</div>
                    <div className="hint">{t('cards.deck.rarityHint')}</div>
                  </div>
                  <div className="rarityInputWrap">
                    <input
                      className="uiInput"
                      type="number"
                      min={0}
                      max={100}
                      value={dist.common}
                      onChange={(e) => setDist({ ...dist, common: Number(e.target.value) || 0 })}
                    />
                    <span className="rarityPct">%</span>
                  </div>
                </div>
                <div className="rarityField">
                  <div className="rarityLabel">
                    <div className="name">{t('cards.rarity.rare')}</div>
                    <div className="hint">{t('cards.deck.rarityHint')}</div>
                  </div>
                  <div className="rarityInputWrap">
                    <input
                      className="uiInput"
                      type="number"
                      min={0}
                      max={100}
                      value={dist.rare}
                      onChange={(e) => setDist({ ...dist, rare: Number(e.target.value) || 0 })}
                    />
                    <span className="rarityPct">%</span>
                  </div>
                </div>
                <div className="rarityField">
                  <div className="rarityLabel">
                    <div className="name">{t('cards.rarity.epic')}</div>
                    <div className="hint">{t('cards.deck.rarityHint')}</div>
                  </div>
                  <div className="rarityInputWrap">
                    <input
                      className="uiInput"
                      type="number"
                      min={0}
                      max={100}
                      value={dist.epic}
                      onChange={(e) => setDist({ ...dist, epic: Number(e.target.value) || 0 })}
                    />
                    <span className="rarityPct">%</span>
                  </div>
                </div>
                <div className="rarityField">
                  <div className="rarityLabel">
                    <div className="name">{t('cards.rarity.legendary')}</div>
                    <div className="hint">{t('cards.deck.rarityHint')}</div>
                  </div>
                  <div className="rarityInputWrap">
                    <input
                      className="uiInput"
                      type="number"
                      min={0}
                      max={100}
                      value={dist.legendary}
                      onChange={(e) => setDist({ ...dist, legendary: Number(e.target.value) || 0 })}
                    />
                    <span className="rarityPct">%</span>
                  </div>
                </div>
              </div>
              {totalDisplay !== 100 || deckAutoBalanced ? (
                <Badge variant="good">{t('data.autoBalanced')}</Badge>
              ) : null}
              {zeroRarity ? <Badge variant="warn">{t('data.zeroRarityWarning')}</Badge> : null}
              <Toggle checked={advancedBalance} onChange={setAdvancedBalance} label={t('data.advancedBalance')} />
              {advancedBalance ? (
                <div className="uiStack">
                  <Row gap={10}>
                    <div style={{ minWidth: 120 }}>
                      <div className="uiHelp">{t('data.cost')}</div>
                      <Input
                        type="number"
                        min={0}
                        value={defaultCost}
                        onChange={(e) => setDefaultCost(Number(e.target.value) || 0)}
                      />
                    </div>
                    <div style={{ minWidth: 180 }}>
                      <div className="uiHelp">{t('data.ability')}</div>
                      <Select
                        value={defaultAbility}
                        onChange={(e) => setDefaultAbility(e.target.value as AbilityKey)}
                      >
                        {ABILITY_OPTIONS.map((ability) => (
                          <option key={ability} value={ability}>
                            {t(`abilities.${ability}`)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </Row>
                  <div className="uiHelp">{t('data.autoBalancedStats')}</div>
                  {balancePreview ? (
                    <Badge>
                      {t('data.balanceDetails')}: total {balancePreview.total} / +{balancePreview.costBonus} / -{balancePreview.abilityPenalty}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
              <details className="uiCollapse">
                <summary>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t('cards.deck.ranges.title')}</div>
                    <div className="uiSub">{t('cards.deck.ranges.enable')}</div>
                  </div>
                </summary>
                <div className="uiCollapseBody">
                  <div className="uiStack">
                    <Toggle
                      checked={rangesConfig.enabled}
                      onChange={(next) => setRangesConfig((prev) => ({ ...prev, enabled: next }))}
                      label={t('cards.deck.ranges.enable')}
                    />
                    <Row gap={12} align="end">
                      <Toggle
                        checked={rangesConfig.lowDuplicate}
                        onChange={(next) => setRangesConfig((prev) => ({ ...prev, lowDuplicate: next }))}
                        label={t('cards.deck.ranges.lowDuplicate')}
                      />
                      <div style={{ minWidth: 140 }}>
                        <div className="uiHelp">{t('cards.deck.ranges.duplicateBudget')}</div>
                        <Input
                          type="number"
                          min={0}
                          max={999}
                          value={rangesConfig.duplicateBudget}
                          onChange={(e) =>
                            setRangesConfig((prev) => ({
                              ...prev,
                              duplicateBudget: clampRangeValue(Number(e.target.value)),
                            }))
                          }
                        />
                      </div>
                      <div style={{ minWidth: 180 }}>
                        <div className="uiHelp">{t('cards.deck.ranges.seed')}</div>
                        <Input
                          value={rangesConfig.seed ?? ''}
                          onChange={(e) => setRangesConfig((prev) => ({ ...prev, seed: e.target.value }))}
                        />
                      </div>
                    </Row>
                    {rangesZeroWarning ? <Badge variant="warn">{t('data.zeroRarityWarning')}</Badge> : null}
                    <div className="rarityGrid">
                      {RARITY_OPTIONS.map((rarity) => {
                        const range = rangesConfig.perRarity[rarity];
                        return (
                          <div key={rarity} className="rarityField" style={{ alignItems: 'flex-start' }}>
                            <div className="rarityLabel">
                              <div className="name">{t(`cards.rarity.${rarity}`)}</div>
                              <div className="hint">{t('cards.deck.ranges.includeRarity')}</div>
                            </div>
                            <div className="uiStack" style={{ gap: 8 }}>
                              <Toggle
                                checked={range.enabled}
                                onChange={(next) => updateRangeToggle(rarity, next)}
                                label={t('cards.deck.ranges.includeRarity')}
                              />
                              <div className="uiRow" style={{ gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div className="uiStack" style={{ gap: 4 }}>
                                  <div className="uiHelp">{t('cards.deck.ranges.attack')}</div>
                                  <div className="uiRow" style={{ gap: 6 }}>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={999}
                                      value={range.attack.min}
                                      onChange={(e) => updateRangeValue(rarity, 'attack', 'min', Number(e.target.value))}
                                      aria-label={`${t('cards.deck.ranges.attack')} ${t('cards.deck.ranges.min')}`}
                                      title={t('cards.deck.ranges.min')}
                                      style={{ width: 74 }}
                                    />
                                    <Input
                                      type="number"
                                      min={0}
                                      max={999}
                                      value={range.attack.max}
                                      onChange={(e) => updateRangeValue(rarity, 'attack', 'max', Number(e.target.value))}
                                      aria-label={`${t('cards.deck.ranges.attack')} ${t('cards.deck.ranges.max')}`}
                                      title={t('cards.deck.ranges.max')}
                                      style={{ width: 74 }}
                                    />
                                  </div>
                                </div>
                                <div className="uiStack" style={{ gap: 4 }}>
                                  <div className="uiHelp">{t('cards.deck.ranges.defense')}</div>
                                  <div className="uiRow" style={{ gap: 6 }}>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={999}
                                      value={range.defense.min}
                                      onChange={(e) => updateRangeValue(rarity, 'defense', 'min', Number(e.target.value))}
                                      aria-label={`${t('cards.deck.ranges.defense')} ${t('cards.deck.ranges.min')}`}
                                      title={t('cards.deck.ranges.min')}
                                      style={{ width: 74 }}
                                    />
                                    <Input
                                      type="number"
                                      min={0}
                                      max={999}
                                      value={range.defense.max}
                                      onChange={(e) => updateRangeValue(rarity, 'defense', 'max', Number(e.target.value))}
                                      aria-label={`${t('cards.deck.ranges.defense')} ${t('cards.deck.ranges.max')}`}
                                      title={t('cards.deck.ranges.max')}
                                      style={{ width: 74 }}
                                    />
                                  </div>
                                </div>
                                <div className="uiStack" style={{ gap: 4 }}>
                                  <div className="uiHelp">{t('cards.deck.ranges.cost')}</div>
                                  <div className="uiRow" style={{ gap: 6 }}>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={999}
                                      value={range.cost?.min ?? 0}
                                      onChange={(e) => updateRangeValue(rarity, 'cost', 'min', Number(e.target.value))}
                                      aria-label={`${t('cards.deck.ranges.cost')} ${t('cards.deck.ranges.min')}`}
                                      title={t('cards.deck.ranges.min')}
                                      style={{ width: 74 }}
                                    />
                                    <Input
                                      type="number"
                                      min={0}
                                      max={999}
                                      value={range.cost?.max ?? 0}
                                      onChange={(e) => updateRangeValue(rarity, 'cost', 'max', Number(e.target.value))}
                                      aria-label={`${t('cards.deck.ranges.cost')} ${t('cards.deck.ranges.max')}`}
                                      title={t('cards.deck.ranges.max')}
                                      style={{ width: 74 }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </ToolSection>

          <ToolSection title={t('data.bindingsTitle')} subtitle={t('data.bindingsSubtitle')}>
            <div className="uiStack">
              {bindingElements.length === 0 ? (
                <div className="uiHelp">{t('data.noBindings')}</div>
              ) : (
                bindingElements.map((el) => (
                  <div key={el.id}>
                    <div className="uiHelp">{el.name}</div>
                    <Select value={el.bindingKey ?? ''} onChange={(e) => updateBinding(el.id, e.target.value)}>
                      <option value="">{t('data.noBinding')}</option>
                      {columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </Select>
                  </div>
                ))
              )}
            </div>
          </ToolSection>

          <ToolSection title={t('data.imageBindingTitle')} subtitle={t('data.imageBindingSubtitle')}>
            <div className="uiStack">
              <div>
                <div className="uiHelp">{t('data.imageColumn')}</div>
                <Select value={imageBinding.column ?? ''} onChange={(e) => updateImageBinding({ column: e.target.value })}>
                  <option value="">{t('common.none')}</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </Select>
              </div>
              <div>
                <div className="uiHelp">{t('data.imagesFolder')}</div>
                <Row gap={8}>
                  <Button size="sm" variant="outline" onClick={pickImagesFolder}>{t('common.open')}</Button>
                  <div className="uiHelp">{imageBinding.imagesFolder || t('data.imagesFolderEmpty')}</div>
                </Row>
              </div>
              <div>
                <div className="uiHelp">{t('data.placeholderImage')}</div>
                <Row gap={8}>
                  <Button size="sm" variant="outline" onClick={pickPlaceholder}>{t('data.placeholderPick')}</Button>
                  <div className="uiHelp">{imageBinding.placeholder ? getFileName(imageBinding.placeholder) : t('common.none')}</div>
                </Row>
              </div>
              <Toggle
                checked={imageBinding.copyToAssets ?? true}
                onChange={(next) => updateImageBinding({ copyToAssets: next })}
                label={t('data.copyImages')}
              />
              <div className="uiHelp">{t('data.copyImagesHint')}</div>
              <Button size="sm" variant="outline" onClick={copyImagesToAssets} disabled={!imageBinding.column}>
                {t('data.copyImages')}
              </Button>
              {copySummary?.missing ? <Badge variant="warn">{t('data.imageMissingCount', { count: copySummary.missing })}</Badge> : null}
              {copySummary?.failed ? <Badge variant="warn">{t('data.imageCopyFailedCount', { count: copySummary.failed })}</Badge> : null}
            </div>
          </ToolSection>
        </div>
      </div>
    </div>
  );

  const centerPanel = (
    <div className="panelShell">
      <div className="panelHeaderSticky uiPanelHeader">
        <div>
          <div className="uiTitle">{t('cards.preview')}</div>
          <div className="uiSub">{selectedRow ? getRowTitle(selectedRow.data ?? {}, language) : t('cards.empty')}</div>
        </div>
        <Row gap={8}>
          <Button size="sm" variant="outline" onClick={() => selectedRow && duplicateRow(selectedRow.id)} disabled={!selectedRow}>
            {t('cards.duplicate')}
          </Button>
          <Button size="sm" variant="danger" onClick={() => requestDelete(selectedRow?.id)} disabled={!selectedRow}>
            {t('common.delete')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setScreen('editor')} disabled={!selectedRow}>
            {t('cards.openEditor')}
          </Button>
        </Row>
      </div>
      <div className="panelScroll uiPanelBody">
        <CardPreviewPanel
          row={previewRow}
          defaultTemplate={defaultTemplate}
          posterWarning={posterWarning}
          showControls={showVideoControls}
          onToggleControls={setShowVideoControls}
        />
      </div>
    </div>
  );

  const rightPanel = (
    <div className="panelShell">
      <div className="panelHeaderSticky uiPanelHeader">
        <div>
          <div className="uiTitle">{t('cards.inspector')}</div>
          <div className="uiSub">{selectedRow ? getRowTitle(selectedRow.data ?? {}, language) : t('cards.empty')}</div>
        </div>
        <Button size="sm" variant="outline" className="panelClose" onClick={() => setRightDrawerOpen(false)}>
          {t('common.close')}
        </Button>
      </div>
      <div className="panelScroll uiPanelBody">
        <CardInspector
          row={selectedRow}
          project={project}
          columns={columns}
          language={language}
          showVideoControls={showVideoControls}
          onToggleVideoControls={setShowVideoControls}
          onUpdateData={(path, value) => selectedRow && updateRowData(selectedRow.id, path, value)}
          onUpdateStat={(key, value) => selectedRow && updateRowStats(selectedRow.id, key, value)}
          onUpdateRow={(patch) => selectedRow && updateRowMeta(selectedRow.id, patch)}
          onPickImage={pickArtImage}
          onPickVideo={pickArtVideo}
          onRegeneratePoster={regeneratePoster}
          onDuplicate={() => selectedRow && duplicateRow(selectedRow.id)}
          onDelete={() => requestDelete(selectedRow?.id)}
        />
      </div>
    </div>
  );

  return (
    <div className="screen uiApp">
      <AppShell
        header={header}
        left={leftPanel}
        center={centerPanel}
        right={rightPanel}
        leftClassName={leftDrawerOpen ? 'drawerOpen' : ''}
        rightClassName={rightDrawerOpen ? 'drawerOpen' : ''}
      />
      <div
        className={`drawerOverlay ${(leftDrawerOpen || rightDrawerOpen) ? 'open' : ''}`}
        onClick={() => {
          setLeftDrawerOpen(false);
          setRightDrawerOpen(false);
        }}
      />
      <Dialog
        open={confirmDeleteOpen}
        title={t('cards.delete.title')}
        description={t('cards.delete.desc', { name: pendingRow ? getRowTitle(pendingRow.data ?? {}, language) || pendingRow.id : '' })}
        confirmText={t('cards.delete.confirm')}
        cancelText={t('cards.delete.cancel')}
        tone="danger"
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />
    </div>
  );
}

function ToolSection(props: { title: string; subtitle?: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details className="uiCollapse" open={props.defaultOpen}>
      <summary>
        <div>
          <div style={{ fontWeight: 600 }}>{props.title}</div>
          {props.subtitle ? <div className="uiSub">{props.subtitle}</div> : null}
        </div>
      </summary>
      <div className="uiCollapseBody">{props.children}</div>
    </details>
  );
}

function collectColumns(rows: Record<string, any>[]) {
  const colSet = new Set<string>();
  rows.forEach((row) => flattenKeys(row, '', colSet));
  return Array.from(colSet);
}

function flattenKeys(value: any, prefix: string, colSet: Set<string>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) colSet.add(prefix);
    return;
  }
  Object.entries(value).forEach(([key, next]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      flattenKeys(next, path, colSet);
      return;
    }
    colSet.add(path);
  });
}

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

function findSetIdByName(project: Project, name: string) {
  if (!name) return project.sets[0]?.id;
  const found = project.sets.find((set) => set.name.toLowerCase() === name.toLowerCase());
  return found?.id ?? project.sets[0]?.id;
}

function buildItemsFromTable(
  table: DataTable,
  project: Project,
  blueprint: Blueprint | undefined,
  itemFallback: (rowId: string) => string,
) {
  const fallbackBlueprintId = blueprint?.id ?? project.blueprints[0]?.id ?? '';
  return table.rows.map((row) => ({
    id: createId('item'),
    name: String(getRowTitle(row.data ?? {}, 'en') || itemFallback(row.id)),
    setId: row.setId ?? project.sets[0]?.id ?? '',
    blueprintId: row.blueprintId ?? fallbackBlueprintId,
    data: row.data ?? {},
    quantity: row.quantity ?? 1,
    sourceRowId: row.id,
    art: row.art,
  }));
}

function isCardArt(value: any): value is CardArt {
  return Boolean(
    value &&
      typeof value === 'object' &&
      ((value.kind === 'image' && typeof value.src === 'string') ||
        (value.kind === 'video' && typeof value.src === 'string')),
  );
}

function ensureUniqueRowId(baseId: string, existing: Set<string>) {
  const cleaned = String(baseId || '').trim() || createId('row');
  let next = cleaned;
  let counter = 1;
  while (existing.has(next)) {
    next = `${cleaned}_${counter}`;
    counter += 1;
  }
  existing.add(next);
  return next;
}

function fileToDataUrl(file: File, errorMessage: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(errorMessage));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function collectTags(rows: DataRow[]) {
  const tagSet = new Set<string>();
  rows.forEach((row) => {
    const data = row.data ?? {};
    const raw = data.tags ?? data.tag;
    if (Array.isArray(raw)) {
      raw.forEach((tag) => {
        const value = String(tag).trim();
        if (value) tagSet.add(value);
      });
      return;
    }
    if (typeof raw === 'string') {
      raw.split(',').forEach((tag) => {
        const value = tag.trim();
        if (value) tagSet.add(value);
      });
    }
  });
  return Array.from(tagSet);
}

function collectTemplates(rows: DataRow[]) {
  const templateSet = new Set<string>();
  rows.forEach((row) => {
    const data = row.data ?? {};
    const template = data.templateKey ?? data.template ?? data.template_key;
    if (template != null && String(template).trim()) {
      templateSet.add(String(template).toLowerCase().trim());
    }
  });
  return Array.from(templateSet);
}

function getRowTitle(data: Record<string, any>, language: 'en' | 'ar') {
  const name = data.name ?? data.title ?? data.character_name ?? data.character_name_en ?? data.character_name_ar;
  if (name && typeof name === 'object' && !Array.isArray(name)) {
    return String(name[language] ?? name.en ?? name.ar ?? '');
  }
  return name == null ? '' : String(name);
}

function getFileName(filePath: string) {
  if (!filePath) return '';
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}
