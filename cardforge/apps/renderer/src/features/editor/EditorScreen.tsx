import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Blueprint,
  CardArt,
  DataRow,
  ElementModel,
  Project,
} from '../../../../../packages/core/src/index';
import { createId, resolvePath } from '../../../../../packages/core/src/index';
import { useAppStore } from '../../state/appStore';
import {
  addRecentProject,
  stringifyProject,
} from '../../../../../packages/storage/src/index';
import {
  Button,
  Divider,
  Input,
  Row,
  Select,
  Toggle,
} from '../../components/ui';
import { Dialog } from '../../ui/Dialog';
import { useTranslation } from 'react-i18next';
import { normalizeImageFit } from '../../utils/imageFit';
import {
  fileUrlToPath,
  resolveImageReferenceSync,
} from '../../utils/imageBinding';
import { CARD_TEMPLATES, TemplateKey } from '../../templates/cardTemplates';
import { CardFrame } from '../../components/cards/CardFrame';
import type { Rarity } from '../../lib/balanceRules';
import { captureVideoPosterFromUrl } from '../../lib/videoPoster';
import { applyTraitsToData } from '../../lib/card.logic';
import type { BaseTraitKey } from '../../lib/traits/traits.types';
import { TraitSelector } from '../../components/editor/TraitSelector';
import { generateCardContent } from '../../services/gemini.service';

type VideoJob = {
  title: string;
  detail?: string;
  pct?: number;
  requestId?: string;
};

export function EditorScreen(props: {
  project: Project;
  onChange: (project: Project) => void;
}) {
  const { t, i18n } = useTranslation();
  const { project, onChange } = props;
  const {
    activeBlueprintId,
    activeTableId,
    setActiveBlueprintId,
    previewRowId,
    setPreviewRowId,
    setRecents,
  } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<ElementModel[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [keepVideoAudio, setKeepVideoAudio] = useState(false);
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{
    atk: number;
    def: number;
    note?: string;
  } | null>(null);
  const [aiConfirmOpen, setAiConfirmOpen] = useState(false);

  const blueprint = useMemo(() => {
    const byId = project.blueprints.find(
      (bp: Blueprint) => bp.id === activeBlueprintId,
    );
    return byId ?? project.blueprints[0];
  }, [project.blueprints, activeBlueprintId]);

  useEffect(() => {
    if (!blueprint) return;
    setActiveBlueprintId(blueprint.id);
    setHistory([deepClone(blueprint.elements)]);
    setHistoryIndex(0);
    setSelectedIds([]);
  }, [blueprint?.id]);

  const elements = blueprint?.elements ?? [];

  const selectedElements = useMemo(
    () => elements.filter((el: ElementModel) => selectedIds.includes(el.id)),
    [elements, selectedIds],
  );

  const selected =
    selectedIds.length === 1 ? (selectedElements[0] ?? null) : null;

  const activeTable =
    project.dataTables.find((table) => table.id === activeTableId) ??
    project.dataTables?.[0];
  const activeRow = useMemo(() => {
    if (!activeTable?.rows?.length) return undefined;
    return (
      activeTable.rows.find((r: any) => r.id === previewRowId) ??
      activeTable.rows[0]
    );
  }, [activeTable, previewRowId]);
  const inspectorData = activeRow?.data ?? {};
  const inspectorTemplateKey = normalizeTemplateKey(
    inspectorData.templateKey,
    'classic',
  );
  const inspectorRarity = normalizeRarity(inspectorData.rarity);
  const inspectorBgColor =
    inspectorData.bgColor ??
    CARD_TEMPLATES[inspectorTemplateKey]?.defaultBgColor ??
    '#2b0d16';
  const inspectorVideoMeta =
    activeRow?.art?.kind === 'video' ? activeRow.art.meta : undefined;
  const traitState = useMemo(
    () => applyTraitsToData(inspectorData),
    [inspectorData],
  );
  const previewArt = useMemo(() => {
    if (!activeRow) return undefined;
    if (isCardArt(activeRow.art)) return activeRow.art;
    const dataArt = (activeRow.data as any)?.art;
    if (isCardArt(dataArt)) return dataArt;
    const binding = activeTable?.imageBinding;
    if (!binding?.column) return undefined;
    const raw = resolvePath(activeRow.data ?? {}, binding.column);
    const resolved = resolveImageReferenceSync(raw, binding);
    if (!resolved) return undefined;
    return { kind: 'image', src: resolved } as CardArt;
  }, [activeRow, activeTable]);
  const resolvedArt = resolveRowArt(activeRow, previewArt);
  const posterWarning =
    previewArt?.kind === 'video' && !previewArt.poster
      ? t('data.posterRequired')
      : undefined;
  const previewTitle =
    inspectorData.name ??
    inspectorData.title ??
    inspectorData.character_name ??
    inspectorData.character_name_en ??
    inspectorData.character_name_ar ??
    activeRow?.id ??
    '';
  const previewDesc =
    inspectorData.desc ??
    inspectorData.ability ??
    inspectorData.ability_en ??
    inspectorData.ability_ar ??
    '';
  const previewTraits = traitState.allTraits;
  const previewAttack = traitState.attack;
  const previewDefense = traitState.defense;
  const previewElement = inspectorData.element ?? inspectorData.main_element;
  const previewRace = inspectorData.race;
  const previewBadgeStyle = (inspectorData as any)?.style?.badges;
  const previewWidth = 280;
  const previewHeight = 360;
  const previewScale = 0.7;
  const previewScaledWidth = Math.round(previewWidth * previewScale);
  const previewScaledHeight = Math.round(previewHeight * previewScale);
  const editorLanguage = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const updateActiveTableRows = useCallback(
    (nextRows: DataRow[]) => {
      if (!activeTable) return;
      const nextTable = { ...activeTable, rows: nextRows };
      const nextProject = {
        ...project,
        dataTables: project.dataTables.map((table) =>
          table.id === activeTable.id ? nextTable : table,
        ),
      };
      onChange(nextProject);
    },
    [activeTable, project, onChange],
  );

  const updateActiveRow = useCallback(
    (updater: (row: DataRow) => DataRow) => {
      if (!activeRow || !activeTable) return;
      const nextRows = activeTable.rows.map((row) =>
        row.id === activeRow.id ? updater(row) : row,
      );
      updateActiveTableRows(nextRows);
    },
    [activeRow, activeTable, updateActiveTableRows],
  );

  const updateActiveRowData = useCallback(
    (path: string, value: any) => {
      updateActiveRow((row) => ({
        ...row,
        data: setPathValue(row.data ?? {}, path, value),
      }));
    },
    [updateActiveRow],
  );

  const updateActiveRowArt = useCallback(
    (art?: CardArt) => {
      updateActiveRow((row) => ({ ...row, art }));
    },
    [updateActiveRow],
  );

  const toNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const updateTraits = useCallback(
    (nextBaseTraits: BaseTraitKey[]) => {
      if (!activeRow) return;
      const { nextData } = applyTraitsToData({
        ...activeRow.data,
        baseTraits: nextBaseTraits,
      });
      updateActiveRow((row) => ({ ...row, data: nextData }));
    },
    [activeRow, updateActiveRow],
  );

  const updateBaseStats = useCallback(
    (patch: { attack?: number; defense?: number }) => {
      if (!activeRow) return;
      const baseAttack =
        patch.attack ??
        toNumber(activeRow.data?.baseAttack ?? activeRow.data?.attack ?? 0);
      const baseDefense =
        patch.defense ??
        toNumber(activeRow.data?.baseDefense ?? activeRow.data?.defense ?? 0);
      const { nextData } = applyTraitsToData({
        ...activeRow.data,
        baseAttack,
        baseDefense,
      });
      updateActiveRow((row) => ({ ...row, data: nextData }));
    },
    [activeRow, updateActiveRow],
  );

  const applyAiBalance = useCallback(() => {
    if (!aiSuggestion) return;
    updateBaseStats({ attack: aiSuggestion.atk, defense: aiSuggestion.def });
    setAiConfirmOpen(false);
  }, [aiSuggestion, updateBaseStats]);

  const handleGenerateSmart = useCallback(async () => {
    if (!activeRow) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
      const result = await generateCardContent({
        lang,
        traits: traitState.baseTraits,
        derivedTraits: traitState.derivedTraits,
        cardType:
          inspectorData.type ??
          inspectorData.templateKey ??
          inspectorData.rarity ??
          '',
        attack: traitState.attack ?? inspectorData.attack ?? 0,
        defense: traitState.defense ?? inspectorData.defense ?? 0,
        relations: {
          human: 'tactical (+1 DEF)',
          animal: 'ferocious (+2 ATK)',
          swordsman: 'swift (+1 ATK, -1 DEF)',
        },
      });
      if (result.name) {
        updateActiveRowData(`name.${lang}`, result.name);
      }
      if (result.description) {
        updateActiveRowData(`desc.${lang}`, result.description);
      }
      if (result.balance) {
        setAiSuggestion(result.balance);
        setAiConfirmOpen(true);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'MISSING_API_KEY'
          ? t('ai.errorMissingKey')
          : t('ai.errorFailed');
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  }, [
    activeRow,
    i18n.language,
    inspectorData.attack,
    inspectorData.defense,
    inspectorData.rarity,
    inspectorData.templateKey,
    inspectorData.type,
    t,
    traitState.attack,
    traitState.baseTraits,
    traitState.defense,
    traitState.derivedTraits,
    updateActiveRowData,
  ]);

  const filterSelectableIds = useCallback(
    (ids: string[], list: ElementModel[]) => {
      return ids.filter((id) => {
        const el = list.find((item) => item.id === id);
        return Boolean(el && !el.locked && el.visible !== false);
      });
    },
    [],
  );

  const setSelection = useCallback(
    (ids: string[], list?: ElementModel[]) => {
      const source = list ?? elements;
      setSelectedIds(filterSelectableIds(ids, source));
    },
    [elements, filterSelectableIds],
  );

  useEffect(() => {
    setSelectedIds((prev) => filterSelectableIds(prev, elements));
  }, [elements, filterSelectableIds]);

  const updateElements = useCallback(
    (nextElements: ElementModel[], recordHistory = true) => {
      if (!blueprint) return;
      const normalized = normalizeZIndex(nextElements);
      setSelectedIds((prev) => filterSelectableIds(prev, normalized));
      const nextProject = {
        ...project,
        blueprints: project.blueprints.map((bp: Blueprint) =>
          bp.id === blueprint.id ? { ...bp, elements: normalized } : bp,
        ),
      };
      onChange(nextProject);
      if (recordHistory) {
        const slice = history.slice(0, historyIndex + 1);
        slice.push(deepClone(normalized));
        const trimmed = slice.slice(-50);
        setHistory(trimmed);
        setHistoryIndex(trimmed.length - 1);
      }
    },
    [blueprint, project, onChange, history, historyIndex, filterSelectableIds],
  );

  const updateSelectedBy = useCallback(
    (updater: (el: ElementModel) => ElementModel) => {
      if (!selectedIds.length) return;
      updateElements(
        elements.map((el) => (selectedIds.includes(el.id) ? updater(el) : el)),
      );
    },
    [elements, selectedIds, updateElements],
  );

  const updateSelectedAll = useCallback(
    (patch: Partial<ElementModel>) => {
      updateSelectedBy((el) => ({ ...el, ...patch }) as ElementModel);
    },
    [updateSelectedBy],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length) return;
    updateElements(elements.filter((el) => !selectedIds.includes(el.id)));
    setSelection([]);
  }, [elements, selectedIds, updateElements, setSelection, t]);

  const duplicateSelection = useCallback(() => {
    if (!selectedIds.length) return;
    const nextElements: ElementModel[] = [];
    const newIds: string[] = [];
    elements.forEach((el) => {
      nextElements.push(el);
      if (selectedIds.includes(el.id)) {
        const dup: ElementModel = {
          ...el,
          id: createId('el'),
          x: el.x + 10,
          y: el.y + 10,
          name: `${el.name} ${t('editor.copySuffix')}`,
        };
        nextElements.push(dup);
        newIds.push(dup.id);
      }
    });
    updateElements(nextElements);
    setSelection(newIds, nextElements);
  }, [elements, selectedIds, updateElements, setSelection]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    updateElements(history[nextIndex], false);
  }, [history, historyIndex, updateElements]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    updateElements(history[nextIndex], false);
  }, [history, historyIndex, updateElements]);

  const saveProject = useCallback(async () => {
    if (!window.cardsmith) return;
    let filePath = project.meta.filePath;
    if (!filePath) {
      const res = await window.cardsmith.saveFile();
      if (res.canceled || !res.filePath) return;
      filePath = res.filePath;
    }
    const nextProject = { ...project, meta: { ...project.meta, filePath } };
    const text = stringifyProject(nextProject);
    await window.cardsmith.writeFile(filePath, { text });
    onChange(nextProject);
    const next = addRecentProject(nextProject, filePath);
    setRecents(next);
  }, [project, onChange, setRecents]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const isCmd = e.ctrlKey || e.metaKey;
      if (isCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveProject();
      }
      if (isCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if (isCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
      if (isCmd && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelection();
      }
      if (e.key === 'Delete' && selectedIds.length) {
        e.preventDefault();
        deleteSelected();
      }
      if (selectedIds.length) {
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updateSelectedBy((el) => ({ ...el, x: el.x - step }));
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          updateSelectedBy((el) => ({ ...el, x: el.x + step }));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          updateSelectedBy((el) => ({ ...el, y: el.y - step }));
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          updateSelectedBy((el) => ({ ...el, y: el.y + step }));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectedIds,
    undo,
    redo,
    duplicateSelection,
    deleteSelected,
    updateSelectedBy,
    saveProject,
  ]);

  if (!blueprint) {
    return (
      <div className="screen" style={{ padding: 24 }}>
        {t('editor.noBlueprint')}
      </div>
    );
  }

  const selectionLabel =
    selectedIds.length > 1
      ? t('editor.selection.count', { count: selectedIds.length })
      : selected
        ? selected.name
        : t('editor.selection.none');

  const hasSelection = selectedIds.length > 0;
  const selectionTypes = Array.from(
    new Set(selectedElements.map((el) => el.type)),
  );
  const isTextSelection =
    selectionTypes.length === 1 && selectionTypes[0] === 'text';
  const isShapeSelection =
    selectionTypes.length === 1 && selectionTypes[0] === 'shape';
  const isImageSelection =
    selectionTypes.length === 1 && selectionTypes[0] === 'image';
  const isIconSelection =
    selectionTypes.length === 1 && selectionTypes[0] === 'icon';

  const getMixedValue = <T,>(values: T[]) => {
    if (values.length === 0)
      return { mixed: false, value: undefined as T | undefined };
    const first = values[0];
    const mixed = values.some((value) => value !== first);
    return { mixed, value: mixed ? undefined : first };
  };

  const mixedX = getMixedValue(selectedElements.map((el) => el.x));
  const mixedY = getMixedValue(selectedElements.map((el) => el.y));
  const mixedW = getMixedValue(selectedElements.map((el) => el.w));
  const mixedH = getMixedValue(selectedElements.map((el) => el.h));
  const mixedRotation = getMixedValue(
    selectedElements.map((el) => el.rotation),
  );
  const mixedOpacity = getMixedValue(
    selectedElements.map((el) => el.opacity ?? 1),
  );
  const mixedFit = getMixedValue(
    selectedElements.map((el) => normalizeImageFit((el as any).fit)),
  );
  const lockRatios = selectedElements.map(
    (el) => (el as any).lockRatio ?? false,
  );
  const allLockRatio = lockRatios.length > 0 && lockRatios.every(Boolean);
  const anyLockRatio = lockRatios.some(Boolean);
  const allVisible = selectedElements.every((el) => el.visible);
  const anyVisible = selectedElements.some((el) => el.visible);
  const allLocked = selectedElements.every((el) => el.locked);
  const anyLocked = selectedElements.some((el) => el.locked);

  const confirmDelete = () => {
    if (!selectedIds.length) return;
    const ok = window.confirm(t('editor.deleteConfirm'));
    if (!ok) return;
    deleteSelected();
  };

  const getLocalizedValue = (value: any, lang: 'en' | 'ar') => {
    if (value && typeof value === 'object') {
      const localized = value as Record<string, any>;
      return localized[lang] ?? '';
    }
    return value == null ? '' : String(value);
  };

  const pickInspectorImage = () => {
    if (!activeRow) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToDataUrl(file, t('editor.errors.readImage'));
        updateActiveRowArt({ kind: 'image', src: dataUrl });
      } catch {
        alert(t('editor.errors.readImage'));
      }
    };
    input.click();
  };

  const pickInspectorVideo = () => {
    if (!activeRow) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const rowId = activeRow.id;
      const filePath = (file as any).path as string | undefined;
      const videoApi = window.cardsmith?.video;
      const projectPath = project.meta.filePath;
      const requestId = createId('video');
      const isLarge = file.size > 3 * 1024 * 1024;

      const fallbackToLocal = () => {
        const src = URL.createObjectURL(file);
        setVideoJob({ title: t('data.videoProcessing') });
        captureVideoPosterFromUrl(src)
          .then((poster) => updateActiveRowArt({ kind: 'video', src, poster }))
          .catch(() => updateActiveRowArt({ kind: 'video', src }))
          .finally(() => setVideoJob(null));
      };

      if (!filePath || !videoApi) {
        fallbackToLocal();
        return;
      }

      let unsubscribe: (() => void) | undefined;
      if (videoApi.onTranscodeProgress) {
        unsubscribe = videoApi.onTranscodeProgress((payload) => {
          if (payload?.requestId !== requestId) return;
          setVideoJob((prev) =>
            prev
              ? {
                  ...prev,
                  pct:
                    typeof payload.pct === 'number'
                      ? Math.max(0, Math.min(100, payload.pct))
                      : prev.pct,
                  detail: payload.time ? `${payload.time}` : prev.detail,
                }
              : prev,
          );
        });
      }

      (async () => {
        try {
          setVideoJob({ title: t('data.videoProcessing') });
          const probe = await videoApi.probe(filePath);
          if (!probe.ok) {
            setVideoJob(null);
            if (probe.error === 'FFMPEG_UNAVAILABLE') {
              alert(t('data.videoTranscodeUnavailable'));
              fallbackToLocal();
              return;
            }
            alert(probe.error ?? t('data.videoProbeFailed'));
            return;
          }
          if (isLarge) {
            alert(t('data.videoLargeWarning'));
          }

          const container = String(probe.container || '').toLowerCase();
          const videoCodec = String(probe.videoCodec || '').toLowerCase();
          const audioCodec = String(probe.audioCodec || '').toLowerCase();
          const supportsContainer =
            container.includes('mp4') || container.includes('mov');
          const supportsVideo = videoCodec === 'h264';
          const supportsAudio =
            !keepVideoAudio || !probe.hasAudio || audioCodec === 'aac';
          const needsTranscode =
            isLarge || !supportsContainer || !supportsVideo || !supportsAudio;

          setVideoJob({
            title: needsTranscode
              ? t('data.videoCompressing')
              : t('data.videoProcessing'),
            pct: 0,
            requestId,
          });

          const transcode = await videoApi.transcode(filePath, {
            projectPath,
            keepAudio: keepVideoAudio,
            requestId,
            assetId: rowId,
            copyOnly: !needsTranscode,
          });

          if (!transcode.ok) {
            setVideoJob(null);
            if (transcode.error === 'FFMPEG_UNAVAILABLE') {
              alert(t('data.videoTranscodeUnavailable'));
              fallbackToLocal();
              return;
            }
            alert(transcode.error ?? t('data.videoTranscodeFailed'));
            return;
          }

          const outPath = transcode.outPath;
          const reprobe = await videoApi.probe(outPath);
          const meta = reprobe.ok ? stripProbeOk(reprobe) : stripProbeOk(probe);

          setVideoJob({ title: t('data.videoGeneratingPoster') });
          const posterRes = await videoApi.poster(outPath, {
            projectPath,
            assetId: rowId,
          });
          const posterUrl = posterRes.ok
            ? toFileUrl(posterRes.posterPath)
            : undefined;
          const srcUrl = toFileUrl(outPath);
          updateActiveRowArt({
            kind: 'video',
            src: srcUrl,
            poster: posterUrl,
            meta,
          });
          setVideoJob(null);
        } catch (err: any) {
          setVideoJob(null);
          alert(err?.message ?? t('data.videoPosterFailed'));
        } finally {
          if (unsubscribe) unsubscribe();
        }
      })();
    };
    input.click();
  };

  const regenerateInspectorPoster = async () => {
    if (!activeRow?.art || activeRow.art.kind !== 'video') return;
    try {
      const videoApi = window.cardsmith?.video;
      if (videoApi) {
        const sourcePath = activeRow.art.src.startsWith('file://')
          ? fileUrlToPath(activeRow.art.src)
          : activeRow.art.src;
        const result = await videoApi.poster(sourcePath, {
          projectPath: project.meta.filePath,
          assetId: activeRow.id,
        });
        if (result.ok) {
          updateActiveRowArt({
            ...activeRow.art,
            poster: toFileUrl(result.posterPath),
          });
          return;
        }
      }
      const poster = await captureVideoPosterFromUrl(activeRow.art.src);
      updateActiveRowArt({ ...activeRow.art, poster });
    } catch (err: any) {
      alert(err?.message ?? t('data.videoPosterFailed'));
    }
  };

  return (
    <div className="flex w-full h-full min-h-0 overflow-hidden bg-[#070A14]">
      {/* ══ Center Canvas (Middle Column) ══ */}
      <main className="flex-1 flex flex-col items-center justify-center relative min-h-0 overflow-auto border-x border-white/10 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]">
        <div className="absolute top-0 w-full shrink-0 p-4 border-b border-white/10 bg-[#0D1117] flex justify-between z-20">
          <div>
            <div className="text-sm font-bold text-slate-200">
              {t('editor.canvasTitle')}
            </div>
            <div className="text-xs text-slate-500">
              {t('editor.canvasSubtitle')}
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="onlySmallRight"
              onClick={() => setRightDrawerOpen(true)}
            >
              {t('cards.inspector')}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full relative z-10 pt-20">
          {!activeRow ? (
            <div className="text-slate-500 text-sm">
              {t('data.selectCardHint')}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                padding: 24,
              }}
            >
              <div
                style={{
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
                  borderRadius: 16,
                }}
              >
                <CardFrame
                  rarity={inspectorRarity}
                  art={resolvedArt}
                  templateKey={inspectorTemplateKey}
                  title={previewTitle}
                  description={previewDesc}
                  race={previewRace}
                  traits={previewTraits}
                  element={previewElement}
                  attack={previewAttack}
                  defense={previewDefense}
                  badgeStyle={previewBadgeStyle}
                  bgColor={inspectorBgColor}
                  posterWarning={posterWarning}
                  width={420}
                  height={540}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══ Right Column (The Inspector) ══ */}
      <aside
        className={`w-80 shrink-0 flex flex-col h-full bg-[#0D1117] z-10 ${rightDrawerOpen ? 'block' : 'hidden md:flex'}`}
      >
        <div className="shrink-0 p-4 border-b border-white/10 flex justify-between">
          <div>
            <div className="text-sm font-bold text-slate-200">
              {t('editor.propertiesTitle')}
            </div>
            <div className="text-xs text-slate-500">{selectionLabel}</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="panelClose md:hidden"
            onClick={() => setRightDrawerOpen(false)}
          >
            {t('common.close')}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {!activeRow ? (
            <div className="empty">{t('data.noData')}</div>
          ) : (
            <details className="uiAccordion" open>
              <summary className="uiAccordionHeader">
                {t('editor.inspector.card')}
              </summary>
              <div className="uiAccordionBody uiStack">
                <div>
                  <div className="uiHelp">{t('common.row')}</div>
                  <Select
                    value={activeRow.id}
                    onChange={(e) => setPreviewRowId(e.target.value)}
                  >
                    {activeTable?.rows?.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.id}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="uiStack">
                  <div className="uiSub">{t('editor.inspector.card')}</div>
                  <div className="uiRow">
                    <div style={{ minWidth: 200 }}>
                      <div className="uiHelp">
                        {t('editor.inspector.template')}
                      </div>
                      <Select
                        value={inspectorTemplateKey}
                        onChange={(e) =>
                          updateActiveRowData('templateKey', e.target.value)
                        }
                      >
                        {Object.values(CARD_TEMPLATES).map((template) => (
                          <option key={template.key} value={template.key}>
                            {template.label[editorLanguage] ??
                              template.label.en}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div style={{ minWidth: 180 }}>
                      <div className="uiHelp">
                        {t('editor.inspector.rarity')}
                      </div>
                      <Select
                        value={inspectorRarity}
                        onChange={(e) =>
                          updateActiveRowData('rarity', e.target.value)
                        }
                      >
                        <option value="common">
                          {t('editor.inspector.rarityCommon')}
                        </option>
                        <option value="rare">
                          {t('editor.inspector.rarityRare')}
                        </option>
                        <option value="epic">
                          {t('editor.inspector.rarityEpic')}
                        </option>
                        <option value="legendary">
                          {t('editor.inspector.rarityLegendary')}
                        </option>
                      </Select>
                    </div>
                    <div style={{ minWidth: 180 }}>
                      <div className="uiHelp">
                        {t('editor.inspector.background')}
                      </div>
                      <Input
                        value={inspectorBgColor}
                        onChange={(e) =>
                          updateActiveRowData('bgColor', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="uiStack">
                  <div className="uiSub">{t('editor.inspector.stats')}</div>
                  <div className="uiRow">
                    <div style={{ minWidth: 140 }}>
                      <div className="uiHelp">
                        {t('editor.inspector.attack')}
                      </div>
                      <Input
                        type="number"
                        value={
                          inspectorData.baseAttack ?? inspectorData.attack ?? 0
                        }
                        onChange={(e) => {
                          const next =
                            e.target.value === '' ? 0 : Number(e.target.value);
                          updateBaseStats({ attack: next });
                        }}
                      />
                    </div>
                    <div style={{ minWidth: 140 }}>
                      <div className="uiHelp">
                        {t('editor.inspector.defense')}
                      </div>
                      <Input
                        type="number"
                        value={
                          inspectorData.baseDefense ??
                          inspectorData.defense ??
                          0
                        }
                        onChange={(e) => {
                          const next =
                            e.target.value === '' ? 0 : Number(e.target.value);
                          updateBaseStats({ defense: next });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="uiStack">
                  <div className="uiSub">{t('traitSystem.title')}</div>
                  <TraitSelector
                    baseTraits={traitState.baseTraits}
                    derivedTraits={traitState.derivedTraits}
                    onChange={updateTraits}
                  />
                  <div className="uiHelp">{t('traitSystem.previewTitle')}</div>
                  <div className="smallPreviewWrap">
                    <div
                      style={{
                        width: previewScaledWidth,
                        height: previewScaledHeight,
                      }}
                    >
                      <div
                        style={{
                          width: previewWidth,
                          height: previewHeight,
                          transform: `scale(${previewScale})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        <CardFrame
                          rarity={inspectorRarity}
                          art={resolvedArt}
                          templateKey={inspectorTemplateKey}
                          title={previewTitle}
                          description={previewDesc}
                          race={previewRace}
                          traits={previewTraits}
                          element={previewElement}
                          attack={previewAttack}
                          defense={previewDefense}
                          badgeStyle={previewBadgeStyle}
                          bgColor={inspectorBgColor}
                          posterWarning={posterWarning}
                          width={previewWidth}
                          height={previewHeight}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="uiStack">
                  <div className="uiSub">{t('ai.title')}</div>
                  <div className="uiRow">
                    <Button
                      variant="outline"
                      onClick={handleGenerateSmart}
                      disabled={aiLoading}
                    >
                      {aiLoading ? t('ai.working') : t('ai.generateSmart')}
                    </Button>
                    {aiSuggestion ? (
                      <span className="uiBadge uiBadgeWarn">
                        ATK {aiSuggestion.atk} / DEF {aiSuggestion.def}
                      </span>
                    ) : null}
                  </div>
                  {aiSuggestion?.note ? (
                    <div className="uiHelp">{aiSuggestion.note}</div>
                  ) : null}
                  {aiError ? (
                    <div className="uiHelp" style={{ color: 'var(--bad)' }}>
                      {aiError}
                    </div>
                  ) : null}
                </div>

                <div className="uiStack">
                  <div className="uiSub">{t('editor.inspector.text')}</div>
                  <div className="uiRow">
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div className="uiHelp">
                        {t('common.name')} ({t('settings.english')})
                      </div>
                      <Input
                        value={getLocalizedValue(inspectorData.name, 'en')}
                        onChange={(e) =>
                          updateActiveRowData('name.en', e.target.value)
                        }
                      />
                    </div>
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div className="uiHelp">
                        {t('common.name')} ({t('settings.arabic')})
                      </div>
                      <Input
                        value={getLocalizedValue(inspectorData.name, 'ar')}
                        onChange={(e) =>
                          updateActiveRowData('name.ar', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="uiRow">
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div className="uiHelp">
                        {t('editor.inspector.ability')} ({t('settings.english')}
                        )
                      </div>
                      <Input
                        value={getLocalizedValue(inspectorData.desc, 'en')}
                        onChange={(e) =>
                          updateActiveRowData('desc.en', e.target.value)
                        }
                      />
                    </div>
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div className="uiHelp">
                        {t('editor.inspector.ability')} ({t('settings.arabic')})
                      </div>
                      <Input
                        value={getLocalizedValue(inspectorData.desc, 'ar')}
                        onChange={(e) =>
                          updateActiveRowData('desc.ar', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="uiStack">
                  <div className="uiSub">{t('editor.inspector.media')}</div>
                  <Row gap={8}>
                    <Button variant="outline" onClick={pickInspectorImage}>
                      {t('data.uploadImage')}
                    </Button>
                    <Button variant="outline" onClick={pickInspectorVideo}>
                      {t('data.uploadVideo')}
                    </Button>
                  </Row>
                  <div className="uiHelp">
                    {activeRow.art?.kind === 'video'
                      ? t('data.videoUsesPoster')
                      : activeRow.art?.kind === 'image'
                        ? t('data.imageSelected')
                        : t('data.noArtwork')}
                  </div>
                  {inspectorVideoMeta ? (
                    <div className="uiHelp">
                      {t('data.videoDetails')}:{' '}
                      {formatVideoMeta(inspectorVideoMeta)}
                    </div>
                  ) : null}
                  <div className="uiHelp">{t('ui.tip.videoPoster')}</div>
                  <Row gap={8}>
                    <Button
                      variant="outline"
                      onClick={regenerateInspectorPoster}
                      disabled={
                        !activeRow.art || activeRow.art.kind !== 'video'
                      }
                    >
                      {t('data.generatePoster')}
                    </Button>
                    <Toggle
                      checked={keepVideoAudio}
                      onChange={setKeepVideoAudio}
                      label={t('data.keepVideoAudio')}
                    />
                  </Row>
                </div>
              </div>
            </details>
          )}

          <Divider />

          {!hasSelection ? (
            <div className="text-slate-500 text-sm text-center py-8">
              {t('editor.propertiesEmpty')} <code>{'{{name}}'}</code>.
            </div>
          ) : (
            <div className="uiStack">
              {selectionTypes.length > 1 ? (
                <div className="hint">{t('editor.propertiesMultiHint')}</div>
              ) : null}

              {selected ? (
                <div>
                  <div className="hint">{t('editor.name')}</div>
                  <Input
                    value={selected.name}
                    onChange={(e) =>
                      updateSelectedAll({ name: e.target.value })
                    }
                  />
                </div>
              ) : null}

              <details className="uiAccordion" open>
                <summary className="uiAccordionHeader">
                  {t('editor.sections.position')}
                </summary>
                <div className="uiAccordionBody">
                  <Row gap={10}>
                    <Toggle
                      checked={allVisible}
                      onChange={(next) => updateSelectedAll({ visible: next })}
                      label={`${t('editor.visible')}${anyVisible && !allVisible ? t('common.mixedSuffix') : ''}`}
                    />
                    <Toggle
                      checked={allLocked}
                      onChange={(next) => updateSelectedAll({ locked: next })}
                      label={`${t('editor.locked')}${anyLocked && !allLocked ? t('common.mixedSuffix') : ''}`}
                    />
                  </Row>
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.x')}</div>
                      <Input
                        type="number"
                        value={mixedX.mixed ? '' : (mixedX.value ?? '')}
                        placeholder={
                          mixedX.mixed ? t('common.mixed') : undefined
                        }
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({ x: Number(e.target.value) });
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.y')}</div>
                      <Input
                        type="number"
                        value={mixedY.mixed ? '' : (mixedY.value ?? '')}
                        placeholder={
                          mixedY.mixed ? t('common.mixed') : undefined
                        }
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({ y: Number(e.target.value) });
                        }}
                      />
                    </div>
                  </Row>
                </div>
              </details>

              <details className="uiAccordion" open>
                <summary className="uiAccordionHeader">
                  {t('editor.sections.size')}
                </summary>
                <div className="uiAccordionBody">
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.w')}</div>
                      <Input
                        type="number"
                        value={mixedW.mixed ? '' : (mixedW.value ?? '')}
                        placeholder={
                          mixedW.mixed ? t('common.mixed') : undefined
                        }
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({
                            w: Math.max(10, Number(e.target.value)),
                          });
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.h')}</div>
                      <Input
                        type="number"
                        value={mixedH.mixed ? '' : (mixedH.value ?? '')}
                        placeholder={
                          mixedH.mixed ? t('common.mixed') : undefined
                        }
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({
                            h: Math.max(10, Number(e.target.value)),
                          });
                        }}
                      />
                    </div>
                  </Row>
                  {isImageSelection ? (
                    <Toggle
                      checked={allLockRatio}
                      onChange={(next) =>
                        updateSelectedAll({ lockRatio: next } as any)
                      }
                      label={`${t('editor.lockRatio')}${anyLockRatio && !allLockRatio ? t('common.mixedSuffix') : ''}`}
                    />
                  ) : null}
                </div>
              </details>

              <details className="uiAccordion" open>
                <summary className="uiAccordionHeader">
                  {t('editor.sections.transform')}
                </summary>
                <div className="uiAccordionBody">
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.rotation')}</div>
                      <Input
                        type="number"
                        value={
                          mixedRotation.mixed ? '' : (mixedRotation.value ?? '')
                        }
                        placeholder={
                          mixedRotation.mixed ? t('common.mixed') : undefined
                        }
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({
                            rotation: Number(e.target.value),
                          });
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.opacity')}</div>
                      <Input
                        type="number"
                        step={0.1}
                        min={0}
                        max={1}
                        value={
                          mixedOpacity.mixed ? '' : (mixedOpacity.value ?? '')
                        }
                        placeholder={
                          mixedOpacity.mixed ? t('common.mixed') : undefined
                        }
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({
                            opacity: Number(e.target.value),
                          });
                        }}
                      />
                    </div>
                  </Row>
                </div>
              </details>

              {isTextSelection ? (
                <details className="uiAccordion" open>
                  <summary className="uiAccordionHeader">
                    {t('editor.sections.text')}
                  </summary>
                  <div className="uiAccordionBody">
                    <div>
                      <div className="hint">{t('editor.bindingKey')}</div>
                      <Input
                        value={
                          getMixedValue(
                            selectedElements.map((el) => el.bindingKey ?? ''),
                          ).mixed
                            ? ''
                            : (selectedElements[0]?.bindingKey ?? '')
                        }
                        placeholder={
                          getMixedValue(
                            selectedElements.map((el) => el.bindingKey ?? ''),
                          ).mixed
                            ? t('common.mixed')
                            : t('editor.bindingPlaceholder')
                        }
                        onChange={(e) =>
                          updateSelectedAll({ bindingKey: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <div className="hint">{t('editor.text')}</div>
                      <Input
                        value={
                          getMixedValue(
                            selectedElements.map(
                              (el) => (el as any).text ?? '',
                            ),
                          ).mixed
                            ? ''
                            : ((selectedElements[0] as any)?.text ?? '')
                        }
                        placeholder={
                          getMixedValue(
                            selectedElements.map(
                              (el) => (el as any).text ?? '',
                            ),
                          ).mixed
                            ? t('common.mixed')
                            : undefined
                        }
                        onChange={(e) =>
                          updateSelectedAll({ text: e.target.value } as any)
                        }
                      />
                    </div>
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.font')}</div>
                        <Input
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fontFamily ?? '',
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.fontFamily ??
                                'Segoe UI')
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fontFamily ?? '',
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) =>
                            updateSelectedAll({
                              fontFamily: e.target.value,
                            } as any)
                          }
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.size')}</div>
                        <Input
                          type="number"
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fontSize ?? 32,
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.fontSize ?? 32)
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fontSize ?? 32,
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({
                              fontSize: Number(e.target.value),
                            } as any);
                          }}
                        />
                      </div>
                    </Row>
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.weight')}</div>
                        <Input
                          type="number"
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fontWeight ?? 400,
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.fontWeight ??
                                400)
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fontWeight ?? 400,
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({
                              fontWeight: Number(e.target.value),
                            } as any);
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.alignField')}</div>
                        <Select
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).align ?? 'left',
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.align ?? 'left')
                          }
                          onChange={(e) =>
                            updateSelectedAll({
                              align: e.target.value as any,
                            } as any)
                          }
                        >
                          <option value="" disabled>
                            {t('common.mixed')}
                          </option>
                          <option value="left">{t('editor.align.left')}</option>
                          <option value="center">
                            {t('editor.align.center')}
                          </option>
                          <option value="right">
                            {t('editor.align.right')}
                          </option>
                        </Select>
                      </div>
                    </Row>
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.color')}</div>
                        <Input
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fill ?? '#ffffff',
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.fill ??
                                '#ffffff')
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fill ?? '#ffffff',
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) =>
                            updateSelectedAll({ fill: e.target.value } as any)
                          }
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.shadowBlur')}</div>
                        <Input
                          type="number"
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).shadowBlur ?? 0,
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.shadowBlur ?? 0)
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).shadowBlur ?? 0,
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({
                              shadowBlur: Number(e.target.value),
                            } as any);
                          }}
                        />
                      </div>
                    </Row>
                  </div>
                </details>
              ) : null}

              {isShapeSelection ? (
                <details className="uiAccordion" open>
                  <summary className="uiAccordionHeader">
                    {t('editor.sections.shape')}
                  </summary>
                  <div className="uiAccordionBody">
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.fill')}</div>
                        <Input
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fill ?? '#1f2a44',
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.fill ??
                                '#1f2a44')
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).fill ?? '#1f2a44',
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) =>
                            updateSelectedAll({ fill: e.target.value } as any)
                          }
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.stroke')}</div>
                        <Input
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).stroke ?? '#3b5b8a',
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.stroke ??
                                '#3b5b8a')
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).stroke ?? '#3b5b8a',
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) =>
                            updateSelectedAll({ stroke: e.target.value } as any)
                          }
                        />
                      </div>
                    </Row>
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.strokeWidth')}</div>
                        <Input
                          type="number"
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).strokeWidth ?? 2,
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.strokeWidth ?? 2)
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).strokeWidth ?? 2,
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({
                              strokeWidth: Number(e.target.value),
                            } as any);
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.radius')}</div>
                        <Input
                          type="number"
                          value={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).radius ?? 0,
                              ),
                            ).mixed
                              ? ''
                              : ((selectedElements[0] as any)?.radius ?? 0)
                          }
                          placeholder={
                            getMixedValue(
                              selectedElements.map(
                                (el) => (el as any).radius ?? 0,
                              ),
                            ).mixed
                              ? t('common.mixed')
                              : undefined
                          }
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({
                              radius: Number(e.target.value),
                            } as any);
                          }}
                        />
                      </div>
                    </Row>
                  </div>
                </details>
              ) : null}

              {isImageSelection ? (
                <details className="uiAccordion" open>
                  <summary className="uiAccordionHeader">
                    {t('editor.sections.image')}
                  </summary>
                  <div className="uiAccordionBody">
                    <div>
                      <div className="hint">{t('editor.bindingKey')}</div>
                      <Input
                        value={
                          getMixedValue(
                            selectedElements.map((el) => el.bindingKey ?? ''),
                          ).mixed
                            ? ''
                            : (selectedElements[0]?.bindingKey ?? '')
                        }
                        placeholder={
                          getMixedValue(
                            selectedElements.map((el) => el.bindingKey ?? ''),
                          ).mixed
                            ? t('common.mixed')
                            : t('editor.bindingPlaceholder')
                        }
                        onChange={(e) =>
                          updateSelectedAll({ bindingKey: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <div className="hint">{t('editor.imageSource')}</div>
                      <Input
                        value={
                          getMixedValue(
                            selectedElements.map((el) => (el as any).src ?? ''),
                          ).mixed
                            ? ''
                            : ((selectedElements[0] as any)?.src ?? '')
                        }
                        placeholder={
                          getMixedValue(
                            selectedElements.map((el) => (el as any).src ?? ''),
                          ).mixed
                            ? t('common.mixed')
                            : undefined
                        }
                        onChange={(e) =>
                          updateSelectedAll({ src: e.target.value } as any)
                        }
                      />
                    </div>
                    <div>
                      <div className="hint">{t('editor.fit')}</div>
                      <Select
                        value={
                          mixedFit.mixed ? '' : (mixedFit.value ?? 'cover')
                        }
                        onChange={(e) =>
                          updateSelectedAll({
                            fit: e.target.value as any,
                          } as any)
                        }
                      >
                        <option value="" disabled>
                          {t('common.mixed')}
                        </option>
                        <option value="contain">{t('fit.contain')}</option>
                        <option value="cover">{t('fit.cover')}</option>
                        <option value="fill">{t('fit.fill')}</option>
                      </Select>
                    </div>
                  </div>
                </details>
              ) : null}

              {isIconSelection ? (
                <details className="uiAccordion" open>
                  <summary className="uiAccordionHeader">
                    {t('editor.sections.icon')}
                  </summary>
                  <div className="uiAccordionBody">
                    <div>
                      <div className="hint">{t('editor.iconLabel')}</div>
                      <Input
                        value={
                          getMixedValue(
                            selectedElements.map(
                              (el) => (el as any).iconName ?? 'ICON',
                            ),
                          ).mixed
                            ? ''
                            : ((selectedElements[0] as any)?.iconName ?? 'ICON')
                        }
                        placeholder={
                          getMixedValue(
                            selectedElements.map(
                              (el) => (el as any).iconName ?? 'ICON',
                            ),
                          ).mixed
                            ? t('common.mixed')
                            : undefined
                        }
                        onChange={(e) =>
                          updateSelectedAll({ iconName: e.target.value } as any)
                        }
                      />
                    </div>
                  </div>
                </details>
              ) : null}

              <details className="uiAccordion" open>
                <summary className="uiAccordionHeader">
                  {t('cards.advanced')}
                </summary>
                <div className="uiAccordionBody">
                  <div>
                    <div className="uiHelp">{t('editor.bindingKey')}</div>
                    <Input
                      value={
                        getMixedValue(
                          selectedElements.map((el) => el.bindingKey ?? ''),
                        ).mixed
                          ? ''
                          : (selectedElements[0]?.bindingKey ?? '')
                      }
                      placeholder={
                        getMixedValue(
                          selectedElements.map((el) => el.bindingKey ?? ''),
                        ).mixed
                          ? t('common.mixed')
                          : t('editor.bindingPlaceholder')
                      }
                      onChange={(e) =>
                        updateSelectedAll({ bindingKey: e.target.value })
                      }
                    />
                  </div>
                  {selected ? (
                    <div>
                      <div className="uiHelp">ID</div>
                      <Input value={selected.id} readOnly />
                    </div>
                  ) : null}
                  <div className="danger-row">
                    <Button variant="danger" onClick={confirmDelete}>
                      {selectedIds.length > 1
                        ? t('editor.deleteElements')
                        : t('editor.deleteElement')}
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {rightDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setRightDrawerOpen(false)}
        />
      )}

      {videoJob ? (
        <div className="videoJobOverlay">
          <div className="videoJobPanel uiPanel">
            <div className="uiTitle">{videoJob.title}</div>
            {videoJob.detail ? (
              <div className="uiSub">{videoJob.detail}</div>
            ) : null}
            <div className="videoJobBar">
              <div
                className="videoJobBarFill"
                style={{ width: `${Math.round(videoJob.pct ?? 0)}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={aiConfirmOpen}
        title={t('ai.confirmBalanceTitle')}
        description={t('ai.confirmBalanceDesc', {
          attack: aiSuggestion?.atk ?? 0,
          defense: aiSuggestion?.def ?? 0,
        })}
        confirmText={t('ai.confirm')}
        cancelText={t('ai.cancel')}
        onConfirm={applyAiBalance}
        onClose={() => setAiConfirmOpen(false)}
      />
    </div>
  );
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeZIndex(elements: ElementModel[]) {
  return elements.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
}

function normalizeTemplateKey(value: any, fallback: TemplateKey): TemplateKey {
  const cleaned = String(value || '')
    .toLowerCase()
    .trim();
  if (
    cleaned &&
    Object.prototype.hasOwnProperty.call(CARD_TEMPLATES, cleaned)
  ) {
    return cleaned as TemplateKey;
  }
  return fallback;
}

function normalizeRarity(value: any): Rarity {
  const cleaned = String(value || '')
    .toLowerCase()
    .trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary')
    return cleaned as Rarity;
  return 'common';
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

function toFileUrl(filePath: string) {
  const normalized = String(filePath || '').replace(/\\/g, '/');
  if (!normalized) return '';
  if (normalized.startsWith('file://')) return normalized;
  if (normalized.startsWith('/')) return `file://${normalized}`;
  return `file:///${normalized}`;
}

function formatVideoMeta(meta?: {
  videoCodec?: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
}) {
  if (!meta) return '';
  const codec = meta.videoCodec ? normalizeCodec(meta.videoCodec) : '';
  const resolution =
    meta.width && meta.height
      ? `${Math.round(meta.width)}x${Math.round(meta.height)}`
      : '';
  const duration = meta.duration ? `${meta.duration.toFixed(1)}s` : '';
  const size = meta.size ? formatBytes(meta.size) : '';
  const parts = [codec, resolution, duration, size].filter(Boolean);
  return parts.join(' • ');
}

function normalizeCodec(codec: string) {
  const cleaned = codec.toLowerCase();
  if (cleaned === 'h264') return 'H.264';
  if (cleaned === 'hevc' || cleaned === 'h265') return 'H.265';
  if (cleaned === 'vp9') return 'VP9';
  if (cleaned === 'av1') return 'AV1';
  return codec.toUpperCase();
}

function formatBytes(size: number) {
  if (!Number.isFinite(size)) return '';
  const mb = size / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)}MB`;
  const kb = size / 1024;
  return `${kb.toFixed(0)}KB`;
}
