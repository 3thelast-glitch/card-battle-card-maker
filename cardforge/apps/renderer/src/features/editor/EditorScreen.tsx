import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Blueprint, ElementModel, Project } from '@cardsmith/core';
import { clamp, createId } from '@cardsmith/core';
import { useAppStore } from '../../state/appStore';
import { addRecentProject, getParentPath, stringifyProject } from '@cardsmith/storage';
import { Button, Divider, IconButton, Input, Panel, Row, Select, Toggle } from '../../components/ui';
import { EditorCanvas } from './EditorCanvas';
import { useTranslation } from 'react-i18next';
import { getElementTypeLabel } from '../../utils/labels';
import { normalizeImageFit } from '../../utils/imageFit';

const DEFAULT_GRID = 10;

export function EditorScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { t } = useTranslation();
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
  const previewRow = useMemo(() => {
    if (!activeTable?.rows?.length) return undefined;
    const row = activeTable.rows.find((r: any) => r.id === previewRowId) ?? activeTable.rows[0];
    return row?.data;
  }, [activeTable, previewRowId]);
  const projectRoot = project.meta.filePath ? getParentPath(project.meta.filePath) : undefined;

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

  return (
    <div className="screen">
      <div className="workspace">
        <div className="sidebar">
          <Panel title={t('editor.toolboxTitle')} subtitle={t('editor.toolboxSubtitle')}>
            <div className="list">
              <Button onClick={addText}>{t('editor.addText')}</Button>
              <Button variant="outline" onClick={addImage}>{t('editor.addImage')}</Button>
              <Button variant="outline" onClick={addShape}>{t('editor.addShape')}</Button>
              <Button variant="outline" onClick={addIcon}>{t('editor.addIcon')}</Button>
              <Divider />
              <div className="hint">{t('editor.shortcuts')}</div>
              <div className="tag-row">
                <span className="kbd">Ctrl</span><span className="kbd">Z</span>
                <span className="kbd">Ctrl</span><span className="kbd">Y</span>
                <span className="kbd">Ctrl</span><span className="kbd">D</span>
                <span className="kbd">Del</span>
              </div>
            </div>
          </Panel>

          <Panel title={t('editor.layersTitle')} subtitle={t('editor.layersSubtitle')}>
            <div className="list">
              {elements.length === 0 ? (
                <div className="empty">{t('editor.noElements')}</div>
              ) : (
                orderedLayers.map((el) => (
                    <div
                      key={el.id}
                      className="list-item"
                      style={{ gap: 8, cursor: 'pointer', borderColor: selectedIds.includes(el.id) ? 'rgba(56,189,248,0.6)' : undefined }}
                      draggable
                      onDragStart={() => setDragLayerId(el.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragLayerId) moveLayer(dragLayerId, el.id);
                        setDragLayerId(null);
                      }}
                      onDragEnd={() => setDragLayerId(null)}
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
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{el.name}</div>
                        <div className="hint">{getElementTypeLabel(t, el.type)}</div>
                      </div>
                      <IconButton
                        variant="outline"
                        title={t('editor.layers.visibility')}
                        onClick={() => {
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
                        onClick={() => {
                          const nextLocked = !el.locked;
                          updateElements(elements.map((e) => (e.id === el.id ? { ...e, locked: nextLocked } : e)));
                          if (nextLocked) {
                            setSelection(selectedIds.filter((id) => id !== el.id));
                          }
                        }}
                      >
                        {el.locked ? t('editor.layers.lockShort') : t('editor.layers.unlockShort')}
                      </IconButton>
                      <IconButton variant="outline" title={t('editor.layers.moveUp')} onClick={() => reorder(el.id, 'up')}>
                        {t('editor.layers.upShort')}
                      </IconButton>
                      <IconButton variant="outline" title={t('editor.layers.moveDown')} onClick={() => reorder(el.id, 'down')}>
                        {t('editor.layers.downShort')}
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        title={t('editor.layers.rename')}
                        onClick={() => {
                          const nextName = window.prompt(t('editor.layers.renamePrompt'), el.name);
                          if (!nextName) return;
                          updateElements(elements.map((e) => (e.id === el.id ? { ...e, name: nextName.trim() } : e)));
                        }}
                      >
                        {t('editor.layers.renameShort')}
                      </IconButton>
                    </div>
                  ))
              )}
            </div>
          </Panel>
        </div>

        <Panel title={t('editor.canvasTitle')} subtitle={t('editor.canvasSubtitle')}>
          <div className="list">
            <Row gap={10}>
              <div className="hint">{t('editor.grid')}</div>
              <Input
                type="number"
                value={gridSize}
                min={4}
                max={64}
                onChange={(e) => setGridSize(clamp(Number(e.target.value), 4, 64))}
                style={{ width: 120 }}
              />
              <Toggle checked={showGrid} onChange={setShowGrid} label={t('editor.showGrid')} />
              <Toggle checked={snapToGrid} onChange={setSnapToGrid} label={t('editor.snap')} />
              <div className="hint">{t('editor.zoom')}</div>
              <Input
                type="number"
                value={zoom}
                step={0.1}
                onChange={(e) => setZoom(clamp(Number(e.target.value), 0.3, 2.5))}
                style={{ width: 80 }}
              />
              <Toggle checked={Boolean(previewRow)} onChange={(next) => setPreviewRowId(next ? activeTable?.rows?.[0]?.id : undefined)} label={t('editor.livePreview')} />
            </Row>

            <Row gap={8}>
              <div className="hint">{t('editor.alignLabel')}</div>
              <IconButton variant="outline" title={t('editor.align.left')} onClick={() => alignSelected('left')}>{t('editor.align.leftShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.center')} onClick={() => alignSelected('center')}>{t('editor.align.centerShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.right')} onClick={() => alignSelected('right')}>{t('editor.align.rightShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.top')} onClick={() => alignSelected('top')}>{t('editor.align.topShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.middle')} onClick={() => alignSelected('middle')}>{t('editor.align.middleShort')}</IconButton>
              <IconButton variant="outline" title={t('editor.align.bottom')} onClick={() => alignSelected('bottom')}>{t('editor.align.bottomShort')}</IconButton>
              <div style={{ marginLeft: 'auto' }}>
              <IconButton variant="outline" title={t('editor.undo')} onClick={undo}>{t('editor.undo')}</IconButton>
              <IconButton variant="outline" title={t('editor.redo')} onClick={redo}>{t('editor.redo')}</IconButton>
              </div>
            </Row>

            <EditorCanvas
              blueprint={blueprint}
              elements={elements}
              selectedIds={selectedIds}
              gridSize={gridSize}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              zoom={zoom}
              projectRoot={projectRoot}
              previewData={previewRow}
              onSelectIds={setSelection}
              onChange={(next) => updateElements(next)}
              onZoomChange={setZoom}
              onDropAsset={handleDropAsset}
            />
          </div>
        </Panel>

                <Panel title={t('editor.propertiesTitle')} subtitle={selectionLabel}>
          {!hasSelection ? (
            <div className="empty">
              {t('editor.propertiesEmpty')} <code>{'{{name}}'}</code>.
            </div>
          ) : (
            <div className="list">
              {selectionTypes.length > 1 ? (
                <div className="hint">{t('editor.propertiesMultiHint')}</div>
              ) : null}

              {selected ? (
                <div>
                  <div className="hint">{t('editor.name')}</div>
                  <Input value={selected.name} onChange={(e) => updateSelectedAll({ name: e.target.value })} />
                </div>
              ) : null}

              <div className="property-section">
                <div className="property-title">{t('editor.sections.position')}</div>
                <div className="property-fields">
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
              </div>

              <div className="property-section">
                <div className="property-title">{t('editor.sections.size')}</div>
                <div className="property-fields">
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
              </div>

              <div className="property-section">
                <div className="property-title">{t('editor.sections.transform')}</div>
                <div className="property-fields">
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
              </div>

              {isTextSelection ? (
                <div className="property-section">
                  <div className="property-title">{t('editor.sections.text')}</div>
                  <div className="property-fields">
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
                </div>
              ) : null}

              {isShapeSelection ? (
                <div className="property-section">
                  <div className="property-title">{t('editor.sections.shape')}</div>
                  <div className="property-fields">
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
                </div>
              ) : null}

              {isImageSelection ? (
                <div className="property-section">
                  <div className="property-title">{t('editor.sections.image')}</div>
                  <div className="property-fields">
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
                </div>
              ) : null}

              {isIconSelection ? (
                <div className="property-section">
                  <div className="property-title">{t('editor.sections.icon')}</div>
                  <div className="property-fields">
                    <div>
                      <div className="hint">{t('editor.iconLabel')}</div>
                      <Input
                        value={getMixedValue(selectedElements.map((el) => (el as any).iconName ?? 'ICON')).mixed ? '' : (selectedElements[0] as any)?.iconName ?? 'ICON'}
                        placeholder={getMixedValue(selectedElements.map((el) => (el as any).iconName ?? 'ICON')).mixed ? t('common.mixed') : undefined}
                        onChange={(e) => updateSelectedAll({ iconName: e.target.value } as any)}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="danger-row">
                <Button variant="danger" onClick={confirmDelete}>
                  {selectedIds.length > 1 ? t('editor.deleteElements') : t('editor.deleteElement')}
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeZIndex(elements: ElementModel[]) {
  return elements.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
}

function fileToDataUrl(file: File, errorMessage: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(errorMessage));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
