import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Blueprint, CardArt, DataRow, ElementModel, Project } from '../../../../../packages/core/src/index';
import { clamp, createId, resolvePath } from '../../../../../packages/core/src/index';
import { useAppStore } from '../../state/appStore';
import { addRecentProject, getParentPath, stringifyProject } from '../../../../../packages/storage/src/index';
import { Button, Divider, IconButton, Input, Kbd, Row, Select, Toggle } from '../../components/ui';
import { EditorCanvas } from './EditorCanvas';
import { useTranslation } from 'react-i18next';
import { getElementTypeLabel } from '../../utils/labels';
import { normalizeImageFit } from '../../utils/imageFit';
import { fileUrlToPath, resolveImageReferenceSync } from '../../utils/imageBinding';
import { CARD_TEMPLATES, TemplateKey } from '../../templates/cardTemplates';
import { captureVideoPosterFromUrl } from '../../lib/videoPoster';

const DEFAULT_GRID = 10;

type VideoJob = {
  title: string;
  detail?: string;
  pct?: number;
  requestId?: string;
};

export function EditorScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { t, i18n } = useTranslation();
  const { project, onChange } = props;
  const { activeBlueprintId, activeTableId, setActiveBlueprintId, previewRowId, setPreviewRowId, setRecents } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<ElementModel[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [keepVideoAudio, setKeepVideoAudio] = useState(false);
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null);

  const blueprint = useMemo(() => {
    const byId = project.blueprints.find((bp: Blueprint) => bp.id === activeBlueprintId);
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

  const selected = selectedIds.length === 1 ? selectedElements[0] ?? null : null;

  const activeTable = project.dataTables.find((table) => table.id === activeTableId) ?? project.dataTables?.[0];
  const activeRow = useMemo(() => {
    if (!activeTable?.rows?.length) return undefined;
    return activeTable.rows.find((r: any) => r.id === previewRowId) ?? activeTable.rows[0];
  }, [activeTable, previewRowId]);
  const previewData = useMemo(() => {
    if (!activeRow) return undefined;
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    const data = activeRow?.data
      ? { ...activeRow.data, ...(activeRow.art ? { art: activeRow.art } : {}), __lang: lang }
      : undefined;
    if (!data || !activeTable) return undefined;
    const binding = activeTable.imageBinding;
    if (!binding?.column) return data;
    const resolved = resolveImageReferenceSync(resolvePath(data, binding.column), binding);
    if (!resolved) return data;
    return setPathValue(data, binding.column, resolved);
  }, [activeRow, activeTable, i18n.language]);
  const projectRoot = project.meta.filePath ? getParentPath(project.meta.filePath) : undefined;
  const editorLanguage = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const updateActiveTableRows = useCallback(
    (nextRows: DataRow[]) => {
      if (!activeTable) return;
      const nextTable = { ...activeTable, rows: nextRows };
      const nextProject = {
        ...project,
        dataTables: project.dataTables.map((table) => (table.id === activeTable.id ? nextTable : table)),
      };
      onChange(nextProject);
    },
    [activeTable, project, onChange],
  );

  const updateActiveRow = useCallback(
    (updater: (row: DataRow) => DataRow) => {
      if (!activeRow || !activeTable) return;
      const nextRows = activeTable.rows.map((row) => (row.id === activeRow.id ? updater(row) : row));
      updateActiveTableRows(nextRows);
    },
    [activeRow, activeTable, updateActiveTableRows],
  );

  const updateActiveRowData = useCallback(
    (path: string, value: any) => {
      updateActiveRow((row) => ({ ...row, data: setPathValue(row.data ?? {}, path, value) }));
    },
    [updateActiveRow],
  );

  const updateActiveRowArt = useCallback(
    (art?: CardArt) => {
      updateActiveRow((row) => ({ ...row, art }));
    },
    [updateActiveRow],
  );

  const filterSelectableIds = useCallback((ids: string[], list: ElementModel[]) => {
    return ids.filter((id) => {
      const el = list.find((item) => item.id === id);
      return Boolean(el && !el.locked && el.visible !== false);
    });
  }, []);

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
      updateSelectedBy((el) => ({ ...el, ...patch }));
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
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
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
  }, [selectedIds, undo, redo, duplicateSelection, deleteSelected, updateSelectedBy, saveProject]);

  const addText = () => {
    const el: ElementModel = {
      id: createId('el'),
      type: 'text',
      name: t('editor.defaults.title'),
      x: 60,
      y: 40,
      w: 500,
      h: 60,
      rotation: 0,
      visible: true,
      opacity: 1,
      zIndex: elements.length + 1,
      text: '{{name}}',
      fontSize: 36,
      fontFamily: 'Segoe UI',
      align: 'center',
      fill: '#ffffff',
    };
    const nextElements = [...elements, el];
    updateElements(nextElements);
    setSelection([el.id], nextElements);
  };

  const addShape = () => {
    const el: ElementModel = {
      id: createId('el'),
      type: 'shape',
      name: t('editor.defaults.rectangle'),
      x: 80,
      y: 140,
      w: 420,
      h: 180,
      rotation: 0,
      visible: true,
      opacity: 1,
      zIndex: elements.length + 1,
      shape: 'rect',
      fill: '#1f2a44',
      stroke: '#3b5b8a',
      strokeWidth: 2,
      radius: 14,
    };
    const nextElements = [...elements, el];
    updateElements(nextElements);
    setSelection([el.id], nextElements);
  };

  const addIcon = () => {
    const el: ElementModel = {
      id: createId('el'),
      type: 'icon',
      name: t('editor.defaults.icon'),
      x: 90,
      y: 90,
      w: 120,
      h: 120,
      rotation: 0,
      visible: true,
      opacity: 1,
      zIndex: elements.length + 1,
      iconName: 'ICON',
      fontSize: 40,
      fill: '#f8d66d',
    };
    const nextElements = [...elements, el];
    updateElements(nextElements);
    setSelection([el.id], nextElements);
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file, t('editor.errors.readImage'));
      const el: ElementModel = {
        id: createId('el'),
        type: 'image',
        name: t('editor.defaults.image'),
        x: 70,
        y: 220,
        w: 420,
        h: 300,
        rotation: 0,
        visible: true,
        opacity: 1,
        zIndex: elements.length + 1,
        src: dataUrl,
        fit: 'cover',
      };
      const nextElements = [...elements, el];
      updateElements(nextElements);
      setSelection([el.id], nextElements);
    };
    input.click();
  };

  const alignSelected = (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedIds.length) return;
    const w = blueprint.size.w;
    const h = blueprint.size.h;
    updateSelectedBy((el) => {
      const patch: Partial<ElementModel> = {};
      if (mode === 'left') patch.x = 0;
      if (mode === 'center') patch.x = (w - el.w) / 2;
      if (mode === 'right') patch.x = w - el.w;
      if (mode === 'top') patch.y = 0;
      if (mode === 'middle') patch.y = (h - el.h) / 2;
      if (mode === 'bottom') patch.y = h - el.h;
      return { ...el, ...patch };
    });
  };

  const orderedLayers = useMemo(
    () => elements.slice().sort((a, b) => b.zIndex - a.zIndex),
    [elements],
  );

  const applyLayerOrder = useCallback(
    (topFirst: ElementModel[]) => {
      const next = normalizeZIndex([...topFirst].reverse());
      updateElements(next);
    },
    [updateElements],
  );

  const moveLayer = useCallback(
    (dragId: string, targetId: string) => {
      if (dragId === targetId) return;
      const list = [...orderedLayers];
      const fromIndex = list.findIndex((el) => el.id === dragId);
      const toIndex = list.findIndex((el) => el.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return;
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      applyLayerOrder(list);
    },
    [orderedLayers, applyLayerOrder],
  );

  const reorder = (id: string, dir: 'up' | 'down') => {
    const list = [...orderedLayers];
    const idx = list.findIndex((el) => el.id === id);
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || target < 0 || target >= list.length) return;
    const temp = list[idx];
    list[idx] = list[target];
    list[target] = temp;
    applyLayerOrder(list);
  };

  if (!blueprint) {
    return <div className="screen" style={{ padding: 24 }}>{t('editor.noBlueprint')}</div>;
  }

  const selectionLabel =
    selectedIds.length > 1 ? t('editor.selection.count', { count: selectedIds.length }) : selected ? selected.name : t('editor.selection.none');

  const hasSelection = selectedIds.length > 0;
  const selectionTypes = Array.from(new Set(selectedElements.map((el) => el.type)));
  const isTextSelection = selectionTypes.length === 1 && selectionTypes[0] === 'text';
  const isShapeSelection = selectionTypes.length === 1 && selectionTypes[0] === 'shape';
  const isImageSelection = selectionTypes.length === 1 && selectionTypes[0] === 'image';
  const isIconSelection = selectionTypes.length === 1 && selectionTypes[0] === 'icon';

  const getMixedValue = <T,>(values: T[]) => {
    if (values.length === 0) return { mixed: false, value: undefined as T | undefined };
    const first = values[0];
    const mixed = values.some((value) => value !== first);
    return { mixed, value: mixed ? undefined : first };
  };

  const mixedX = getMixedValue(selectedElements.map((el) => el.x));
  const mixedY = getMixedValue(selectedElements.map((el) => el.y));
  const mixedW = getMixedValue(selectedElements.map((el) => el.w));
  const mixedH = getMixedValue(selectedElements.map((el) => el.h));
  const mixedRotation = getMixedValue(selectedElements.map((el) => el.rotation));
  const mixedOpacity = getMixedValue(selectedElements.map((el) => el.opacity ?? 1));
  const mixedFit = getMixedValue(selectedElements.map((el) => normalizeImageFit((el as any).fit)));
  const lockRatios = selectedElements.map((el) => (el as any).lockRatio ?? false);
  const allLockRatio = lockRatios.length > 0 && lockRatios.every(Boolean);
  const anyLockRatio = lockRatios.some(Boolean);
  const allVisible = selectedElements.every((el) => el.visible);
  const anyVisible = selectedElements.some((el) => el.visible);
  const allLocked = selectedElements.every((el) => el.locked);
  const anyLocked = selectedElements.some((el) => el.locked);

  const handleDropAsset = useCallback(
    (asset: { src: string; name: string }, point: { x: number; y: number }) => {
      if (!blueprint) return;
      const w = 300;
      const h = 300;
      const maxX = Math.max(0, blueprint.size.w - w);
      const maxY = Math.max(0, blueprint.size.h - h);
      const x = clamp(point.x - w / 2, 0, maxX);
      const y = clamp(point.y - h / 2, 0, maxY);
      const el: ElementModel = {
        id: createId('el'),
        type: 'image',
        name: asset.name || t('editor.defaults.image'),
        x,
        y,
        w,
        h,
        rotation: 0,
        visible: true,
        opacity: 1,
        zIndex: elements.length + 1,
        src: asset.src,
        fit: 'cover',
      };
      const nextElements = [...elements, el];
      updateElements(nextElements);
      setSelection([el.id], nextElements);
    },
    [blueprint, elements, updateElements, setSelection, t],
  );

  const confirmDelete = () => {
    if (!selectedIds.length) return;
    const ok = window.confirm(t('editor.deleteConfirm'));
    if (!ok) return;
    deleteSelected();
  };

  const inspectorData = activeRow?.data ?? {};
  const inspectorTemplateKey = normalizeTemplateKey(inspectorData.templateKey, 'classic');
  const inspectorRarity = normalizeRarity(inspectorData.rarity);
  const inspectorBgColor =
    inspectorData.bgColor ?? CARD_TEMPLATES[inspectorTemplateKey]?.defaultBgColor ?? '#2b0d16';
  const inspectorVideoMeta = activeRow?.art?.kind === 'video' ? activeRow.art.meta : undefined;
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
                  pct: typeof payload.pct === 'number' ? Math.max(0, Math.min(100, payload.pct)) : prev.pct,
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
          const supportsContainer = container.includes('mp4') || container.includes('mov');
          const supportsVideo = videoCodec === 'h264';
          const supportsAudio = !keepVideoAudio || !probe.hasAudio || audioCodec === 'aac';
          const needsTranscode = isLarge || !supportsContainer || !supportsVideo || !supportsAudio;

          setVideoJob({
            title: needsTranscode ? t('data.videoCompressing') : t('data.videoProcessing'),
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
          const posterRes = await videoApi.poster(outPath, { projectPath, assetId: rowId });
          const posterUrl = posterRes.ok ? toFileUrl(posterRes.posterPath) : undefined;
          const srcUrl = toFileUrl(outPath);
          updateActiveRowArt({ kind: 'video', src: srcUrl, poster: posterUrl, meta });
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
        const sourcePath = activeRow.art.src.startsWith('file://') ? fileUrlToPath(activeRow.art.src) : activeRow.art.src;
        const result = await videoApi.poster(sourcePath, { projectPath: project.meta.filePath, assetId: activeRow.id });
        if (result.ok) {
          updateActiveRowArt({ ...activeRow.art, poster: toFileUrl(result.posterPath) });
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
    <div className="screen uiApp">
      <div className="editorShell">
        <aside className={`editorPanel editorLeft ${leftDrawerOpen ? 'drawerOpen' : ''}`}>
          <div className="editorPanelHeader">
            <div>
              <div className="uiTitle">{t('editor.toolboxTitle')}</div>
              <div className="uiSub">{t('editor.toolboxSubtitle')}</div>
            </div>
            <Button size="sm" variant="outline" className="panelClose" onClick={() => setLeftDrawerOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
          <div className="editorPanelBody">
            <details className="uiCollapse" open>
              <summary>
                <div>
                  <div style={{ fontWeight: 600 }}>{t('editor.toolboxTitle')}</div>
                  <div className="uiSub">{t('editor.toolboxSubtitle')}</div>
                </div>
              </summary>
              <div className="uiCollapseBody">
                <div className="editorToolGrid">
                  <Button size="sm" variant="outline" className="editorToolBtn" onClick={addText}>
                    <span className="toolIcon">+</span>
                    {t('editor.addText')}
                  </Button>
                  <Button size="sm" variant="outline" className="editorToolBtn" onClick={addImage}>
                    <span className="toolIcon">+</span>
                    {t('editor.addImage')}
                  </Button>
                  <Button size="sm" variant="outline" className="editorToolBtn" onClick={addShape}>
                    <span className="toolIcon">+</span>
                    {t('editor.addShape')}
                  </Button>
                  <Button size="sm" variant="outline" className="editorToolBtn" onClick={addIcon}>
                    <span className="toolIcon">+</span>
                    {t('editor.addIcon')}
                  </Button>
                </div>
              </div>
            </details>

            <details className="uiCollapse" open>
              <summary>
                <div>
                  <div style={{ fontWeight: 600 }}>{t('editor.layersTitle')}</div>
                  <div className="uiSub">{t('editor.layersSubtitle')}</div>
                </div>
              </summary>
              <div className="uiCollapseBody">
                {elements.length === 0 ? (
                  <div className="empty">{t('editor.noElements')}</div>
                ) : (
                  <div className="editorLayerList">
                    {orderedLayers.map((el) => (
                      <div
                        key={el.id}
                        className={`layerRow ${selectedIds.includes(el.id) ? 'isSelected' : ''}`}
                        draggable
                        onDragStart={() => setDragLayerId(el.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragLayerId) moveLayer(dragLayerId, el.id);
                          setDragLayerId(null);
                        }}
                        onDragEnd={() => setDragLayerId(null)}
                        onDoubleClick={() => {
                          const nextName = window.prompt(t('editor.layers.renamePrompt'), el.name);
                          if (!nextName) return;
                          updateElements(elements.map((e) => (e.id === el.id ? { ...e, name: nextName.trim() } : e)));
                        }}
                        onClick={(e) => {
                          if (el.locked || el.visible === false) return;
                          if (e.shiftKey) {
                            setSelection(
                              selectedIds.includes(el.id)
                                ? selectedIds.filter((id) => id !== el.id)
                                : [...selectedIds, el.id],
                            );
                          } else {
                            setSelection([el.id]);
                          }
                        }}
                      >
                        <div className="layerMeta">
                          <div className="layerName">{el.name}</div>
                          <div className="layerHint">{getElementTypeLabel(t, el.type)}</div>
                        </div>
                        <div className="layerActions">
                          <IconButton
                            variant="outline"
                            title={t('editor.layers.visibility')}
                            onClick={(event) => {
                              event.stopPropagation();
                              const nextVisible = !el.visible;
                              updateElements(elements.map((e) => (e.id === el.id ? { ...e, visible: nextVisible } : e)));
                              if (!nextVisible) {
                                setSelection(selectedIds.filter((id) => id !== el.id));
                              }
                            }}
                          >
                            {el.visible ? t('editor.layers.visibleShort') : t('editor.layers.hiddenShort')}
                          </IconButton>
                          <IconButton
                            variant="outline"
                            title={t('editor.layers.lock')}
                            onClick={(event) => {
                              event.stopPropagation();
                              const nextLocked = !el.locked;
                              updateElements(elements.map((e) => (e.id === el.id ? { ...e, locked: nextLocked } : e)));
                              if (nextLocked) {
                                setSelection(selectedIds.filter((id) => id !== el.id));
                              }
                            }}
                          >
                            {el.locked ? t('editor.layers.lockShort') : t('editor.layers.unlockShort')}
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>

            <Divider />
            <div className="uiHelp">{t('editor.shortcuts')}</div>
            <div className="uiRow" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Kbd>Ctrl</Kbd><Kbd>Z</Kbd>
              <Kbd>Ctrl</Kbd><Kbd>Y</Kbd>
              <Kbd>Ctrl</Kbd><Kbd>D</Kbd>
              <Kbd>Del</Kbd>
            </div>
          </div>
        </aside>

        <main className="editorPanel editorCenter">
          <div className="editorPanelHeader">
            <div>
              <div className="uiTitle">{t('editor.canvasTitle')}</div>
              <div className="uiSub">{t('editor.canvasSubtitle')}</div>
            </div>
            <div className="uiRow" style={{ justifyContent: 'flex-end' }}>
              <Button
                size="sm"
                variant="outline"
                className="onlySmallLeft"
                onClick={() => setLeftDrawerOpen(true)}
              >
                {t('editor.toolboxTitle')}
              </Button>
              <div className="uiRow" style={{ gap: 6 }}>
                <div className="uiHelp">{t('editor.zoom')}</div>
                <Input
                  type="number"
                  value={zoom}
                  step={0.1}
                  onChange={(e) => setZoom(clamp(Number(e.target.value), 0.3, 2.5))}
                  style={{ width: 70 }}
                />
              </div>
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
          <div className="editorPanelBody editorCenterBody">
            <div className="uiRow" style={{ flexWrap: 'wrap' }}>
              <div className="uiHelp">{t('editor.grid')}</div>
              <Input
                type="number"
                value={gridSize}
                min={4}
                max={64}
                onChange={(e) => setGridSize(clamp(Number(e.target.value), 4, 64))}
                style={{ width: 100 }}
              />
              <Toggle checked={showGrid} onChange={setShowGrid} label={t('editor.showGrid')} />
              <Toggle checked={snapToGrid} onChange={setSnapToGrid} label={t('editor.snap')} />
              <Toggle
                checked={Boolean(previewData)}
                onChange={(next) => setPreviewRowId(next ? activeTable?.rows?.[0]?.id : undefined)}
                label={t('editor.livePreview')}
              />
              <div style={{ marginLeft: 'auto' }} className="uiRow">
                <IconButton variant="outline" title={t('editor.undo')} onClick={undo}>{t('editor.undo')}</IconButton>
                <IconButton variant="outline" title={t('editor.redo')} onClick={redo}>{t('editor.redo')}</IconButton>
              </div>
            </div>
            <div className="uiRow" style={{ flexWrap: 'wrap' }}>
              <div className="uiHelp">{t('editor.alignLabel')}</div>
              <IconButton variant="outline" title={t('editor.align.left')} onClick={() => alignSelected('left')}>{t('editor.align.leftShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.center')} onClick={() => alignSelected('center')}>{t('editor.align.centerShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.right')} onClick={() => alignSelected('right')}>{t('editor.align.rightShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.top')} onClick={() => alignSelected('top')}>{t('editor.align.topShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.middle')} onClick={() => alignSelected('middle')}>{t('editor.align.middleShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.bottom')} onClick={() => alignSelected('bottom')}>{t('editor.align.bottomShort')}</IconButton>
            </div>
            <div className="editorCenterStage">
              <EditorCanvas
                blueprint={blueprint}
                elements={elements}
                selectedIds={selectedIds}
                gridSize={gridSize}
                showGrid={showGrid}
                snapToGrid={snapToGrid}
                zoom={zoom}
                projectRoot={projectRoot}
                previewData={previewData}
                onSelectIds={setSelection}
                onChange={(next) => updateElements(next)}
                onZoomChange={setZoom}
                onDropAsset={handleDropAsset}
              />
            </div>
          </div>
        </main>

        <aside className={`editorPanel editorRight ${rightDrawerOpen ? 'drawerOpen' : ''}`}>
          <div className="editorPanelHeader">
            <div>
              <div className="uiTitle">{t('editor.propertiesTitle')}</div>
              <div className="uiSub">{selectionLabel}</div>
            </div>
            <Button size="sm" variant="outline" className="panelClose" onClick={() => setRightDrawerOpen(false)}>
              {t('common.close')}
            </Button>
          </div>
          <div className="editorPanelBody">
            {!activeRow ? (
              <div className="empty">{t('data.noData')}</div>
            ) : (
              <details className="uiAccordion" open>
                <summary className="uiAccordionHeader">{t('editor.inspector.card')}</summary>
                <div className="uiAccordionBody uiStack">
                  <div>
                    <div className="uiHelp">{t('common.row')}</div>
                    <Select value={activeRow.id} onChange={(e) => setPreviewRowId(e.target.value)}>
                      {activeTable?.rows?.map((row) => (
                        <option key={row.id} value={row.id}>{row.id}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="uiStack">
                    <div className="uiSub">{t('editor.inspector.card')}</div>
                    <div className="uiRow">
                      <div style={{ minWidth: 200 }}>
                        <div className="uiHelp">{t('editor.inspector.template')}</div>
                        <Select
                          value={inspectorTemplateKey}
                          onChange={(e) => updateActiveRowData('templateKey', e.target.value)}
                        >
                          {Object.values(CARD_TEMPLATES).map((template) => (
                            <option key={template.key} value={template.key}>
                              {template.label[editorLanguage] ?? template.label.en}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div style={{ minWidth: 180 }}>
                        <div className="uiHelp">{t('editor.inspector.rarity')}</div>
                        <Select
                          value={inspectorRarity}
                          onChange={(e) => updateActiveRowData('rarity', e.target.value)}
                        >
                          <option value="common">{t('editor.inspector.rarityCommon')}</option>
                          <option value="rare">{t('editor.inspector.rarityRare')}</option>
                          <option value="epic">{t('editor.inspector.rarityEpic')}</option>
                          <option value="legendary">{t('editor.inspector.rarityLegendary')}</option>
                        </Select>
                      </div>
                      <div style={{ minWidth: 180 }}>
                        <div className="uiHelp">{t('editor.inspector.background')}</div>
                        <Input
                          value={inspectorBgColor}
                          onChange={(e) => updateActiveRowData('bgColor', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="uiStack">
                    <div className="uiSub">{t('editor.inspector.stats')}</div>
                    <div className="uiRow">
                      <div style={{ minWidth: 140 }}>
                        <div className="uiHelp">{t('editor.inspector.attack')}</div>
                        <Input
                          type="number"
                          value={inspectorData.attack ?? ''}
                          onChange={(e) => {
                            const next = e.target.value === '' ? '' : Number(e.target.value);
                            updateActiveRowData('attack', next);
                          }}
                        />
                      </div>
                      <div style={{ minWidth: 140 }}>
                        <div className="uiHelp">{t('editor.inspector.defense')}</div>
                        <Input
                          type="number"
                          value={inspectorData.defense ?? ''}
                          onChange={(e) => {
                            const next = e.target.value === '' ? '' : Number(e.target.value);
                            updateActiveRowData('defense', next);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="uiStack">
                    <div className="uiSub">{t('editor.inspector.text')}</div>
                    <div className="uiRow">
                      <div style={{ minWidth: 200, flex: 1 }}>
                        <div className="uiHelp">{t('common.name')} ({t('settings.english')})</div>
                        <Input
                          value={getLocalizedValue(inspectorData.name, 'en')}
                          onChange={(e) => updateActiveRowData('name.en', e.target.value)}
                        />
                      </div>
                      <div style={{ minWidth: 200, flex: 1 }}>
                        <div className="uiHelp">{t('common.name')} ({t('settings.arabic')})</div>
                        <Input
                          value={getLocalizedValue(inspectorData.name, 'ar')}
                          onChange={(e) => updateActiveRowData('name.ar', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="uiRow">
                      <div style={{ minWidth: 200, flex: 1 }}>
                        <div className="uiHelp">{t('editor.inspector.ability')} ({t('settings.english')})</div>
                        <Input
                          value={getLocalizedValue(inspectorData.desc, 'en')}
                          onChange={(e) => updateActiveRowData('desc.en', e.target.value)}
                        />
                      </div>
                      <div style={{ minWidth: 200, flex: 1 }}>
                        <div className="uiHelp">{t('editor.inspector.ability')} ({t('settings.arabic')})</div>
                        <Input
                          value={getLocalizedValue(inspectorData.desc, 'ar')}
                          onChange={(e) => updateActiveRowData('desc.ar', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="uiStack">
                    <div className="uiSub">{t('editor.inspector.media')}</div>
                    <Row gap={8}>
                      <Button variant="outline" onClick={pickInspectorImage}>{t('data.uploadImage')}</Button>
                      <Button variant="outline" onClick={pickInspectorVideo}>{t('data.uploadVideo')}</Button>
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
                        {t('data.videoDetails')}: {formatVideoMeta(inspectorVideoMeta)}
                      </div>
                    ) : null}
                    <div className="uiHelp">{t('ui.tip.videoPoster')}</div>
                    <Row gap={8}>
                      <Button variant="outline" onClick={regenerateInspectorPoster} disabled={!activeRow.art || activeRow.art.kind !== 'video'}>
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
              <div className="empty">
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
                    <Input value={selected.name} onChange={(e) => updateSelectedAll({ name: e.target.value })} />
                  </div>
                ) : null}

                <details className="uiAccordion" open>
                  <summary className="uiAccordionHeader">{t('editor.sections.position')}</summary>
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
                          value={mixedX.mixed ? '' : mixedX.value ?? ''}
                          placeholder={mixedX.mixed ? t('common.mixed') : undefined}
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
                          value={mixedY.mixed ? '' : mixedY.value ?? ''}
                          placeholder={mixedY.mixed ? t('common.mixed') : undefined}
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
                <summary className="uiAccordionHeader">{t('editor.sections.size')}</summary>
                <div className="uiAccordionBody">
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.w')}</div>
                      <Input
                        type="number"
                        value={mixedW.mixed ? '' : mixedW.value ?? ''}
                        placeholder={mixedW.mixed ? t('common.mixed') : undefined}
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({ w: Math.max(10, Number(e.target.value)) });
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.h')}</div>
                      <Input
                        type="number"
                        value={mixedH.mixed ? '' : mixedH.value ?? ''}
                        placeholder={mixedH.mixed ? t('common.mixed') : undefined}
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({ h: Math.max(10, Number(e.target.value)) });
                        }}
                      />
                    </div>
                  </Row>
                  {isImageSelection ? (
                    <Toggle
                      checked={allLockRatio}
                      onChange={(next) => updateSelectedAll({ lockRatio: next } as any)}
                      label={`${t('editor.lockRatio')}${anyLockRatio && !allLockRatio ? t('common.mixedSuffix') : ''}`}
                    />
                  ) : null}
                </div>
              </details>

              <details className="uiAccordion" open>
                <summary className="uiAccordionHeader">{t('editor.sections.transform')}</summary>
                <div className="uiAccordionBody">
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">{t('editor.rotation')}</div>
                      <Input
                        type="number"
                        value={mixedRotation.mixed ? '' : mixedRotation.value ?? ''}
                        placeholder={mixedRotation.mixed ? t('common.mixed') : undefined}
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({ rotation: Number(e.target.value) });
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
                        value={mixedOpacity.mixed ? '' : mixedOpacity.value ?? ''}
                        placeholder={mixedOpacity.mixed ? t('common.mixed') : undefined}
                        onChange={(e) => {
                          if (e.target.value === '') return;
                          updateSelectedAll({ opacity: Number(e.target.value) });
                        }}
                      />
                    </div>
                  </Row>
                </div>
              </details>

              {isTextSelection ? (
                <details className="uiAccordion" open>
                  <summary className="uiAccordionHeader">{t('editor.sections.text')}</summary>
                  <div className="uiAccordionBody">
                    <div>
                      <div className="hint">{t('editor.bindingKey')}</div>
                      <Input
                        value={getMixedValue(selectedElements.map((el) => el.bindingKey ?? '')).mixed ? '' : (selectedElements[0]?.bindingKey ?? '')}
                        placeholder={getMixedValue(selectedElements.map((el) => el.bindingKey ?? '')).mixed ? t('common.mixed') : t('editor.bindingPlaceholder')}
                        onChange={(e) => updateSelectedAll({ bindingKey: e.target.value })}
                      />
                    </div>
                    <div>
                      <div className="hint">{t('editor.text')}</div>
                      <Input
                        value={getMixedValue(selectedElements.map((el) => (el as any).text ?? '')).mixed ? '' : (selectedElements[0] as any)?.text ?? ''}
                        placeholder={getMixedValue(selectedElements.map((el) => (el as any).text ?? '')).mixed ? t('common.mixed') : undefined}
                        onChange={(e) => updateSelectedAll({ text: e.target.value } as any)}
                      />
                    </div>
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.font')}</div>
                        <Input
                          value={getMixedValue(selectedElements.map((el) => (el as any).fontFamily ?? '')).mixed ? '' : (selectedElements[0] as any)?.fontFamily ?? 'Segoe UI'}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).fontFamily ?? '')).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => updateSelectedAll({ fontFamily: e.target.value } as any)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.size')}</div>
                        <Input
                          type="number"
                          value={getMixedValue(selectedElements.map((el) => (el as any).fontSize ?? 32)).mixed ? '' : (selectedElements[0] as any)?.fontSize ?? 32}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).fontSize ?? 32)).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({ fontSize: Number(e.target.value) } as any);
                          }}
                        />
                      </div>
                    </Row>
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.weight')}</div>
                        <Input
                          type="number"
                          value={getMixedValue(selectedElements.map((el) => (el as any).fontWeight ?? 400)).mixed ? '' : (selectedElements[0] as any)?.fontWeight ?? 400}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).fontWeight ?? 400)).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({ fontWeight: Number(e.target.value) } as any);
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.alignField')}</div>
                        <Select
                          value={
                            getMixedValue(selectedElements.map((el) => (el as any).align ?? 'left')).mixed
                              ? ''
                              : (selectedElements[0] as any)?.align ?? 'left'
                          }
                          onChange={(e) => updateSelectedAll({ align: e.target.value as any } as any)}
                        >
                          <option value="" disabled>{t('common.mixed')}</option>
                          <option value="left">{t('editor.align.left')}</option>
                          <option value="center">{t('editor.align.center')}</option>
                          <option value="right">{t('editor.align.right')}</option>
                        </Select>
                      </div>
                    </Row>
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.color')}</div>
                        <Input
                          value={getMixedValue(selectedElements.map((el) => (el as any).fill ?? '#ffffff')).mixed ? '' : (selectedElements[0] as any)?.fill ?? '#ffffff'}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).fill ?? '#ffffff')).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => updateSelectedAll({ fill: e.target.value } as any)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.shadowBlur')}</div>
                        <Input
                          type="number"
                          value={getMixedValue(selectedElements.map((el) => (el as any).shadowBlur ?? 0)).mixed ? '' : (selectedElements[0] as any)?.shadowBlur ?? 0}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).shadowBlur ?? 0)).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({ shadowBlur: Number(e.target.value) } as any);
                          }}
                        />
                      </div>
                    </Row>
                  </div>
                </details>
              ) : null}

              {isShapeSelection ? (
                <details className="uiAccordion" open>
                  <summary className="uiAccordionHeader">{t('editor.sections.shape')}</summary>
                  <div className="uiAccordionBody">
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.fill')}</div>
                        <Input
                          value={getMixedValue(selectedElements.map((el) => (el as any).fill ?? '#1f2a44')).mixed ? '' : (selectedElements[0] as any)?.fill ?? '#1f2a44'}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).fill ?? '#1f2a44')).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => updateSelectedAll({ fill: e.target.value } as any)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.stroke')}</div>
                        <Input
                          value={getMixedValue(selectedElements.map((el) => (el as any).stroke ?? '#3b5b8a')).mixed ? '' : (selectedElements[0] as any)?.stroke ?? '#3b5b8a'}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).stroke ?? '#3b5b8a')).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => updateSelectedAll({ stroke: e.target.value } as any)}
                        />
                      </div>
                    </Row>
                    <Row gap={10}>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.strokeWidth')}</div>
                        <Input
                          type="number"
                          value={getMixedValue(selectedElements.map((el) => (el as any).strokeWidth ?? 2)).mixed ? '' : (selectedElements[0] as any)?.strokeWidth ?? 2}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).strokeWidth ?? 2)).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({ strokeWidth: Number(e.target.value) } as any);
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="hint">{t('editor.radius')}</div>
                        <Input
                          type="number"
                          value={getMixedValue(selectedElements.map((el) => (el as any).radius ?? 0)).mixed ? '' : (selectedElements[0] as any)?.radius ?? 0}
                          placeholder={getMixedValue(selectedElements.map((el) => (el as any).radius ?? 0)).mixed ? t('common.mixed') : undefined}
                          onChange={(e) => {
                            if (e.target.value === '') return;
                            updateSelectedAll({ radius: Number(e.target.value) } as any);
                          }}
                        />
                      </div>
                    </Row>
                  </div>
                </details>
              ) : null}

              {isImageSelection ? (
                <details className="uiAccordion" open>
                  <summary className="uiAccordionHeader">{t('editor.sections.image')}</summary>
                  <div className="uiAccordionBody">
                    <div>
                      <div className="hint">{t('editor.bindingKey')}</div>
                      <Input
                        value={getMixedValue(selectedElements.map((el) => el.bindingKey ?? '')).mixed ? '' : (selectedElements[0]?.bindingKey ?? '')}
                        placeholder={getMixedValue(selectedElements.map((el) => el.bindingKey ?? '')).mixed ? t('common.mixed') : t('editor.bindingPlaceholder')}
                        onChange={(e) => updateSelectedAll({ bindingKey: e.target.value })}
                      />
                    </div>
                    <div>
                      <div className="hint">{t('editor.imageSource')}</div>
                      <Input
                        value={getMixedValue(selectedElements.map((el) => (el as any).src ?? '')).mixed ? '' : (selectedElements[0] as any)?.src ?? ''}
                        placeholder={getMixedValue(selectedElements.map((el) => (el as any).src ?? '')).mixed ? t('common.mixed') : undefined}
                        onChange={(e) => updateSelectedAll({ src: e.target.value } as any)}
                      />
                    </div>
                    <div>
                      <div className="hint">{t('editor.fit')}</div>
                      <Select
                        value={mixedFit.mixed ? '' : (mixedFit.value ?? 'cover')}
                        onChange={(e) => updateSelectedAll({ fit: e.target.value as any } as any)}
                      >
                        <option value="" disabled>{t('common.mixed')}</option>
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
                  <summary className="uiAccordionHeader">{t('editor.sections.icon')}</summary>
                  <div className="uiAccordionBody">
                    <div>
                      <div className="hint">{t('editor.iconLabel')}</div>
                      <Input
                        value={getMixedValue(selectedElements.map((el) => (el as any).iconName ?? 'ICON')).mixed ? '' : (selectedElements[0] as any)?.iconName ?? 'ICON'}
                        placeholder={getMixedValue(selectedElements.map((el) => (el as any).iconName ?? 'ICON')).mixed ? t('common.mixed') : undefined}
                        onChange={(e) => updateSelectedAll({ iconName: e.target.value } as any)}
                      />
                    </div>
                  </div>
                </details>
              ) : null}

              <details className="uiAccordion" open>
                <summary className="uiAccordionHeader">{t('cards.advanced')}</summary>
                <div className="uiAccordionBody">
                  <div>
                    <div className="uiHelp">{t('editor.bindingKey')}</div>
                    <Input
                      value={getMixedValue(selectedElements.map((el) => el.bindingKey ?? '')).mixed ? '' : (selectedElements[0]?.bindingKey ?? '')}
                      placeholder={getMixedValue(selectedElements.map((el) => el.bindingKey ?? '')).mixed ? t('common.mixed') : t('editor.bindingPlaceholder')}
                      onChange={(e) => updateSelectedAll({ bindingKey: e.target.value })}
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
                      {selectedIds.length > 1 ? t('editor.deleteElements') : t('editor.deleteElement')}
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          )}
          </div>
        </aside>
      </div>
      <div
        className={`drawerOverlay ${leftDrawerOpen || rightDrawerOpen ? 'open' : ''}`}
        onClick={() => {
          setLeftDrawerOpen(false);
          setRightDrawerOpen(false);
        }}
      />
      {videoJob ? (
        <div className="videoJobOverlay">
          <div className="videoJobPanel uiPanel">
            <div className="uiTitle">{videoJob.title}</div>
            {videoJob.detail ? <div className="uiSub">{videoJob.detail}</div> : null}
            <div className="videoJobBar">
              <div className="videoJobBarFill" style={{ width: `${Math.round(videoJob.pct ?? 0)}%` }} />
            </div>
          </div>
        </div>
      ) : null}
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
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'classic' || cleaned === 'moon' || cleaned === 'sand') return cleaned as TemplateKey;
  return fallback;
}

function normalizeRarity(value: any) {
  const cleaned = String(value || '').toLowerCase().trim();
  if (cleaned === 'rare' || cleaned === 'epic' || cleaned === 'legendary') return cleaned;
  return 'common';
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

function formatVideoMeta(meta?: { videoCodec?: string; width?: number; height?: number; duration?: number; size?: number }) {
  if (!meta) return '';
  const codec = meta.videoCodec ? normalizeCodec(meta.videoCodec) : '';
  const resolution = meta.width && meta.height ? `${Math.round(meta.width)}x${Math.round(meta.height)}` : '';
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
