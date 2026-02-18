import { useEffect, useMemo, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import type {
  ArtTransform,
  Blueprint,
  CardArt,
  DataRow,
  DataTable,
  ElementModel,
  Project,
} from '../../../../../packages/core/src/index';
import { createId, resolvePath } from '../../../../../packages/core/src/index';
import { getParentPath } from '../../../../../packages/storage/src/index';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Divider, Input, Row, Select, Toggle } from '../../components/ui';
import { parseCsvFile, parseXlsxFile, mapRowsToCards } from '../../lib/bulkImport';
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
import { CardInspector } from '../inspector/CardInspector';
import { Dialog } from '../../ui/Dialog';
import { CardFrame } from '../../components/cards/CardFrame';
import { EditorCanvas } from '../editor/EditorCanvas';

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
  const [selectedId, setSelectedId] = useState<string | null>(previewRowId ?? null);
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
  const [previewMode, setPreviewMode] = useState<'preview' | 'edit'>('preview');
  const [editorSelectedIds, setEditorSelectedIds] = useState<string[]>([]);
  const [editorZoom, setEditorZoom] = useState(1);
  const [editorShowGrid, setEditorShowGrid] = useState(false);
  const [editorSnapToGrid, setEditorSnapToGrid] = useState(true);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [copySummary, setCopySummary] = useState<CopySummary | null>(null);
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const artDragRef = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    pointerId: number;
  } | null>(null);

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
  const projectRoot = project.meta.filePath ? getParentPath(project.meta.filePath) : undefined;

  const tagOptions = useMemo(() => collectTags(rows), [rows]);
  const templateOptions = useMemo(() => collectTemplates(rows), [rows]);
  const filteredRows = useMemo(() => filterCards(rows, filters, language), [rows, filters, language]);
  const selectedRow = useMemo(
    () => filteredRows.find((row) => row.id === selectedId) ?? null,
    [filteredRows, selectedId],
  );
  const pendingRow = pendingDeleteId ? rows.find((row) => row.id === pendingDeleteId) : undefined;
  const generatorRow = lastGeneratedId ? rows.find((row) => row.id === lastGeneratedId) : undefined;

  useEffect(() => {
    if (!filteredRows.length) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredRows.some((row) => row.id === selectedId)) {
      setSelectedId(filteredRows[0].id);
    }
  }, [filteredRows, selectedId]);

  useEffect(() => {
    setPreviewRowId(selectedId ?? undefined);
  }, [selectedId, setPreviewRowId]);

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

  const resolvedArt = resolveRowArt(selectedRow, previewArt);

  const posterWarning = previewArt?.kind === 'video' && !previewArt.poster ? t('data.posterRequired') : undefined;
  const previewData = selectedRow?.data ?? {};
  const previewTemplateKey = normalizeTemplateKey(
    previewData.templateKey ?? previewData.template ?? previewData.template_key,
    defaultTemplate,
  );
  const previewTitle = selectedRow ? getRowTitle(previewData, language) || selectedRow.id : '';
  const previewDesc =
    previewData.desc ?? previewData.ability ?? previewData.ability_en ?? previewData.ability_ar ?? '';
  const previewTraits = normalizeTraits(previewData.traits ?? previewData.trait);
  const previewRarity = normalizeRarity(previewData.rarity);
  const previewAttack = normalizeNumber(previewData.attack ?? previewData.stats?.attack);
  const previewDefense = normalizeNumber(previewData.defense ?? previewData.stats?.defense);
  const previewElement = previewData.element;
  const previewRace = previewData.race;
  const previewBgColor = previewData.bgColor;
  const previewBadgeStyle = (previewData as any)?.style?.badges;
  const previewTemplate = CARD_TEMPLATES[previewTemplateKey] ?? CARD_TEMPLATES[defaultTemplate];
  const smallPreviewWidth = 240;
  const smallPreviewHeight = 320;
  const editorPreviewData = useMemo(() => {
    if (!selectedRow || !table) return undefined;
    const data = selectedRow.data
      ? { ...selectedRow.data, ...(selectedRow.art ? { art: selectedRow.art } : {}), __lang: language }
      : undefined;
    if (!data) return undefined;
    if (!imageBinding.column) return data;
    const resolved = resolveImageReferenceSync(resolvePath(data, imageBinding.column), imageBinding);
    if (!resolved) return data;
    return setPathValue(data, imageBinding.column, resolved);
  }, [selectedRow, table, imageBinding, language]);
  const generatorData = generatorRow?.data ?? {};
  const generatorTemplateKey = normalizeTemplateKey(
    generatorData.templateKey ?? generatorData.template ?? generatorData.template_key,
    defaultTemplate,
  );
  const generatorTitle = generatorRow ? getRowTitle(generatorData ?? {}, language) || generatorRow.id : '';
  const generatorDesc =
    generatorData.desc ?? generatorData.ability ?? generatorData.ability_en ?? generatorData.ability_ar ?? '';
  const generatorTraits = normalizeTraits(generatorData.traits ?? generatorData.trait);
  const generatorRarity = normalizeRarity(generatorData.rarity);
  const generatorAttack = normalizeNumber(generatorData.attack ?? generatorData.stats?.attack);
  const generatorDefense = normalizeNumber(generatorData.defense ?? generatorData.stats?.defense);
  const generatorArt = generatorRow ? resolveRowArt(generatorRow, undefined) : undefined;
  const generatorBadgeStyle = (generatorData as any)?.style?.badges;

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

  const handleArtPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectedRow || !resolvedArt) return;
    const current = normalizeArtTransform(resolvedArt.transform);
    artDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: current.x,
      baseY: current.y,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleArtPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectedRow || !resolvedArt) return;
    const state = artDragRef.current;
    if (!state) return;
    const next = clampArtTransform(
      {
        ...normalizeArtTransform(resolvedArt.transform),
        x: state.baseX + (event.clientX - state.startX),
        y: state.baseY + (event.clientY - state.startY),
      },
      previewTemplate?.artRect,
      smallPreviewWidth,
      smallPreviewHeight,
    );
    updateRowArt(selectedRow.id, { ...resolvedArt, transform: next });
  };

  const handleArtPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = artDragRef.current;
    if (!state) return;
    artDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(state.pointerId);
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
    setSelectedId(nextRow.id);
  };

  const removeRow = (rowId: string) => {
    if (!table) return;
    const nextRows = table.rows.filter((row) => row.id !== rowId);
    updateRows(nextRows);
    if (selectedId === rowId && nextRows.length) {
      setSelectedId(nextRows[0].id);
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
    setSelectedId(nextId);
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

  const updateBlueprintElements = (nextElements: ElementModel[]) => {
    if (!blueprint) return;
    const normalized = normalizeZIndex(nextElements);
    const nextProject = {
      ...project,
      blueprints: project.blueprints.map((bp) => (bp.id === blueprint.id ? { ...bp, elements: normalized } : bp)),
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

  const handleImport = async (file: File, mode: 'csv' | 'xlsx') => {
    const parsed = mode === 'csv' ? await parseCsvFile(file) : await parseXlsxFile(file);
    const { cards, errors } = mapRowsToCards(parsed, { defaultTemplate, hasLanguageColumns });
    const existingIds = new Set(rows.map((row) => row.id));
    const rowIndex = new Map(rows.map((row, index) => [row.id, index]));
    const nextRows = [...rows];
    let created = 0;
    let updated = 0;
    let warnings = 0;
    let firstCreatedId: string | undefined;

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
      if (!firstCreatedId) firstCreatedId = nextId;
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
    if (firstCreatedId) {
      setSelectedId(firstCreatedId);
    }
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
    let firstGeneratedId: string | undefined;
    result.cards.forEach((card) => {
      const nextId = ensureUniqueRowId(card.id, existingIds);
      if (!firstGeneratedId) firstGeneratedId = nextId;
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
    if (firstGeneratedId) {
      setSelectedId(firstGeneratedId);
    }
    setLastGeneratedId(firstGeneratedId ?? null);
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
            setSelectedId(id);
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
              {generatorRow ? (
                <div className="generatorInlinePreview">
                  <CardFrame
                    rarity={generatorRarity}
                    art={generatorArt}
                    templateKey={generatorTemplateKey}
                    title={generatorTitle}
                    description={generatorDesc}
                    race={generatorData.race}
                    traits={generatorTraits}
                    element={generatorData.element}
                    attack={generatorAttack}
                    defense={generatorDefense}
                    badgeStyle={generatorBadgeStyle}
                    bgColor={generatorData.bgColor}
                    width={260}
                    height={360}
                  />
                </div>
              ) : (
                <div className="generatorInlinePreviewEmpty">{t('cards.generatorPreviewEmpty')}</div>
              )}
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
        <div className="uiRow bigPreviewTools">
          <div className="uiRow" style={{ gap: 6 }}>
            <Button
              size="sm"
              variant={previewMode === 'preview' ? 'primary' : 'outline'}
              onClick={() => setPreviewMode('preview')}
              disabled={!selectedRow}
            >
              {t('data.preview')}
            </Button>
            <Button
              size="sm"
              variant={previewMode === 'edit' ? 'primary' : 'outline'}
              onClick={() => setPreviewMode('edit')}
              disabled={!selectedRow || !blueprint}
            >
              {t('data.edit')}
            </Button>
          </div>
          <div className="uiRow" style={{ gap: 8 }}>
            <Button size="sm" variant="outline" onClick={() => selectedRow && duplicateRow(selectedRow.id)} disabled={!selectedRow}>
              {t('cards.duplicate')}
            </Button>
            <Button size="sm" variant="danger" onClick={() => requestDelete(selectedRow?.id)} disabled={!selectedRow}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>
      <div className="panelScroll uiPanelBody">
        {!selectedRow ? (
          <div className="empty">{t('data.selectCardHint')}</div>
        ) : previewMode === 'preview' ? (
          <div className="bigPreviewWrap">
            <div className="bigPreviewCard">
            <CardFrame
              rarity={previewRarity}
              art={resolvedArt}
              templateKey={previewTemplateKey}
              title={previewTitle}
              description={previewDesc}
              race={previewRace}
              traits={previewTraits}
              element={previewElement}
              attack={previewAttack}
              defense={previewDefense}
              badgeStyle={previewBadgeStyle}
              bgColor={previewBgColor}
              posterWarning={posterWarning}
              width={420}
              height={540}
            />
            </div>
          </div>
        ) : blueprint ? (
          <div className="bigPreviewWrap">
            <EditorCanvas
              blueprint={blueprint}
              elements={blueprint.elements ?? []}
              selectedIds={editorSelectedIds}
              gridSize={10}
              showGrid={editorShowGrid}
              snapToGrid={editorSnapToGrid}
              zoom={editorZoom}
              projectRoot={projectRoot}
              previewData={editorPreviewData}
              onSelectIds={setEditorSelectedIds}
              onChange={updateBlueprintElements}
              onZoomChange={setEditorZoom}
            />
          </div>
        ) : (
          <div className="empty">{t('data.selectCardHint')}</div>
        )}
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
        {!selectedRow ? (
          <div className="empty">{t('data.selectCardHint')}</div>
        ) : (
          <div className="uiStack" style={{ gap: 12 }}>
            <div className="smallPreviewWrap">
              <CardFrame
                rarity={previewRarity}
                art={resolvedArt}
                templateKey={previewTemplateKey}
                title={previewTitle}
                description={previewDesc}
                race={previewRace}
                traits={previewTraits}
                element={previewElement}
                attack={previewAttack}
                defense={previewDefense}
                badgeStyle={previewBadgeStyle}
                bgColor={previewBgColor}
                posterWarning={posterWarning}
                width={smallPreviewWidth}
                height={smallPreviewHeight}
                artInteractive
                onArtPointerDown={handleArtPointerDown}
                onArtPointerMove={handleArtPointerMove}
                onArtPointerUp={handleArtPointerUp}
                onArtPointerLeave={handleArtPointerUp}
              />
            </div>
            <CardInspector
              row={selectedRow}
              project={project}
              columns={columns}
              language={language}
              onUpdateData={(path, value) => selectedRow && updateRowData(selectedRow.id, path, value)}
              onUpdateStat={(key, value) => selectedRow && updateRowStats(selectedRow.id, key, value)}
              onUpdateRow={(patch) => selectedRow && updateRowMeta(selectedRow.id, patch)}
              onPickImage={pickArtImage}
              onDuplicate={() => selectedRow && duplicateRow(selectedRow.id)}
              onDelete={() => requestDelete(selectedRow?.id)}
            />
          </div>
        )}
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

function resolveRowArt(row?: DataRow, fallback?: CardArt) {
  if (!row) return undefined;
  if (isCardArt(row.art)) return row.art;
  const dataArt = (row.data as any)?.art;
  if (isCardArt(dataArt)) return dataArt;
  if (fallback && isCardArt(fallback)) return fallback;
  return undefined;
}

function normalizeTemplateKey(value: any, fallback: TemplateKey): TemplateKey {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned && Object.prototype.hasOwnProperty.call(CARD_TEMPLATES, cleaned)) {
    return cleaned as TemplateKey;
  }
  return fallback;
}

function normalizeRarity(value: any): Rarity {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned as Rarity;
  return 'common';
}

function normalizeTraits(value: any) {
  if (Array.isArray(value)) {
    return value.map((trait) => String(trait).toLowerCase().trim()).filter(Boolean);
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  return raw
    .split(/[,|]/g)
    .map((trait) => trait.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeNumber(value: any) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeArtTransform(value?: ArtTransform): ArtTransform {
  return {
    x: Number.isFinite(value?.x) ? value!.x : 0,
    y: Number.isFinite(value?.y) ? value!.y : 0,
    scale: Number.isFinite(value?.scale) ? Math.min(2.5, Math.max(0.6, value!.scale)) : 1,
    rotate: Number.isFinite(value?.rotate) ? Math.max(-180, Math.min(180, value!.rotate)) : 0,
    fit: value?.fit === 'contain' ? 'contain' : 'cover',
  };
}

function clampArtTransform(
  value: ArtTransform,
  artRect: { left: number; right: number; top: number; bottom: number } | undefined,
  frameWidth: number,
  frameHeight: number,
) {
  const scale = Math.min(2.5, Math.max(0.6, value.scale || 1));
  if (!artRect) {
    return { ...value, scale };
  }
  const artWidth = Math.max(1, frameWidth - artRect.left - artRect.right);
  const artHeight = Math.max(1, frameHeight - artRect.top - artRect.bottom);
  const maxOffsetX = Math.max(0, (artWidth * scale - artWidth) / 2);
  const maxOffsetY = Math.max(0, (artHeight * scale - artHeight) / 2);
  return {
    ...value,
    scale,
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, value.x || 0)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, value.y || 0)),
  };
}

function normalizeZIndex(elements: ElementModel[]) {
  return elements.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
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

function stripProbeOk(result: any) {
  if (!result || !result.ok) return undefined;
  const { ok, ...meta } = result;
  return meta;
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
