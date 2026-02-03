import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Blueprint, ElementModel, Project } from '@cardsmith/core';
import { clamp, createId } from '@cardsmith/core';
import { useAppStore } from '../../state/appStore';
import { addRecentProject, stringifyProject } from '@cardsmith/storage';
import { Button, Divider, IconButton, Input, Panel, Row, Select, Toggle } from '../../components/ui';
import { EditorCanvas } from './EditorCanvas';

const DEFAULT_GRID = 10;

export function EditorScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { project, onChange } = props;
  const { activeBlueprintId, activeTableId, setActiveBlueprintId, previewRowId, setPreviewRowId, setRecents } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<ElementModel[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const blueprint = useMemo(() => {
    const byId = project.blueprints.find((bp: Blueprint) => bp.id === activeBlueprintId);
    return byId ?? project.blueprints[0];
  }, [project.blueprints, activeBlueprintId]);

  useEffect(() => {
    if (!blueprint) return;
    setActiveBlueprintId(blueprint.id);
    setHistory([deepClone(blueprint.elements)]);
    setHistoryIndex(0);
    setSelectedId(null);
  }, [blueprint?.id]);

  const elements = blueprint?.elements ?? [];

  const selected = useMemo(
    () => elements.find((el: ElementModel) => el.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const activeTable = project.dataTables.find((table) => table.id === activeTableId) ?? project.dataTables?.[0];
  const previewRow = useMemo(() => {
    if (!activeTable?.rows?.length) return undefined;
    const row = activeTable.rows.find((r: any) => r.id === previewRowId) ?? activeTable.rows[0];
    return row?.data;
  }, [activeTable, previewRowId]);

  const updateElements = useCallback(
    (nextElements: ElementModel[], recordHistory = true) => {
      if (!blueprint) return;
      const normalized = normalizeZIndex(nextElements);
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
    [blueprint, project, onChange, history, historyIndex],
  );

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
        if (!selected) return;
        const dup = { ...selected, id: createId('el'), x: selected.x + 16, y: selected.y + 16, name: `${selected.name} Copy` };
        updateElements([...elements, dup]);
        setSelectedId(dup.id);
      }
      if (e.key === 'Delete' && selected) {
        updateElements(elements.filter((el) => el.id !== selected.id));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [elements, selected, undo, redo, updateElements, saveProject]);

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

  const addText = () => {
    const el: ElementModel = {
      id: createId('el'),
      type: 'text',
      name: 'Title',
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
    updateElements([...elements, el]);
    setSelectedId(el.id);
  };

  const addShape = () => {
    const el: ElementModel = {
      id: createId('el'),
      type: 'shape',
      name: 'Rectangle',
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
    updateElements([...elements, el]);
    setSelectedId(el.id);
  };

  const addIcon = () => {
    const el: ElementModel = {
      id: createId('el'),
      type: 'icon',
      name: 'Icon',
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
    updateElements([...elements, el]);
    setSelectedId(el.id);
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      const el: ElementModel = {
        id: createId('el'),
        type: 'image',
        name: 'Image',
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
      updateElements([...elements, el]);
      setSelectedId(el.id);
    };
    input.click();
  };

  const updateSelected = (patch: Partial<ElementModel>) => {
    if (!selected) return;
    updateElements(elements.map((el) => (el.id === selected.id ? { ...el, ...patch } : el)));
  };

  const alignSelected = (mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selected) return;
    const w = blueprint.size.w;
    const h = blueprint.size.h;
    const patch: Partial<ElementModel> = {};
    if (mode === 'left') patch.x = 0;
    if (mode === 'center') patch.x = (w - selected.w) / 2;
    if (mode === 'right') patch.x = w - selected.w;
    if (mode === 'top') patch.y = 0;
    if (mode === 'middle') patch.y = (h - selected.h) / 2;
    if (mode === 'bottom') patch.y = h - selected.h;
    updateSelected(patch);
  };

  const reorder = (id: string, dir: 'up' | 'down') => {
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex((el) => el.id === id);
    const target = dir === 'up' ? idx + 1 : idx - 1;
    if (idx < 0 || target < 0 || target >= sorted.length) return;
    const temp = sorted[idx];
    sorted[idx] = sorted[target];
    sorted[target] = temp;
    updateElements(normalizeZIndex(sorted));
  };

  if (!blueprint) {
    return <div className="screen" style={{ padding: 24 }}>No blueprint selected.</div>;
  }

  return (
    <div className="screen">
      <div className="workspace">
        <div className="sidebar">
          <Panel title="Toolbox" subtitle="Add elements to the canvas.">
            <div className="list">
              <Button onClick={addText}>Add Text</Button>
              <Button variant="outline" onClick={addImage}>Add Image</Button>
              <Button variant="outline" onClick={addShape}>Add Shape</Button>
              <Button variant="outline" onClick={addIcon}>Add Icon</Button>
              <Divider />
              <div className="hint">Shortcuts</div>
              <div className="tag-row">
                <span className="kbd">Ctrl</span><span className="kbd">Z</span>
                <span className="kbd">Ctrl</span><span className="kbd">Y</span>
                <span className="kbd">Ctrl</span><span className="kbd">D</span>
                <span className="kbd">Del</span>
              </div>
            </div>
          </Panel>

          <Panel title="Layers" subtitle="Visibility, lock, and order.">
            <div className="list">
              {elements.length === 0 ? (
                <div className="empty">No elements yet. Add text, image, or shape.</div>
              ) : (
                elements
                  .slice()
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((el) => (
                    <div
                      key={el.id}
                      className="list-item"
                      style={{ gap: 8, cursor: 'pointer', borderColor: selectedId === el.id ? 'rgba(56,189,248,0.6)' : undefined }}
                      onClick={() => setSelectedId(el.id)}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{el.name}</div>
                        <div className="hint">{el.type}</div>
                      </div>
                      <IconButton
                        variant="outline"
                        title="Toggle Visibility"
                        onClick={() => updateElements(elements.map((e) => (e.id === el.id ? { ...e, visible: !e.visible } : e)))}
                      >
                        {el.visible ? 'V' : 'H'}
                      </IconButton>
                      <IconButton
                        variant="outline"
                        title="Toggle Lock"
                        onClick={() => updateElements(elements.map((e) => (e.id === el.id ? { ...e, locked: !e.locked } : e)))}
                      >
                        {el.locked ? 'L' : 'U'}
                      </IconButton>
                      <IconButton variant="outline" title="Move Up" onClick={() => reorder(el.id, 'up')}>Up</IconButton>
                      <IconButton variant="outline" title="Move Down" onClick={() => reorder(el.id, 'down')}>Down</IconButton>
                      <IconButton variant="ghost" title="Select" onClick={() => setSelectedId(el.id)}>Sel</IconButton>
                    </div>
                  ))
              )}
            </div>
          </Panel>
        </div>

        <Panel title="Canvas" subtitle="Drag, resize, rotate. Hold Space to pan, Ctrl+Wheel to zoom.">
          <div className="list">
            <Row gap={10}>
              <div className="hint">Grid</div>
              <Input
                type="number"
                value={gridSize}
                min={4}
                max={64}
                onChange={(e) => setGridSize(clamp(Number(e.target.value), 4, 64))}
                style={{ width: 120 }}
              />
              <Toggle checked={snapToGrid} onChange={setSnapToGrid} label="Snap-to-grid" />
              <div className="hint">Zoom</div>
              <Input
                type="number"
                value={zoom}
                step={0.1}
                onChange={(e) => setZoom(clamp(Number(e.target.value), 0.3, 2.5))}
                style={{ width: 80 }}
              />
              <Toggle checked={Boolean(previewRow)} onChange={(next) => setPreviewRowId(next ? activeTable?.rows?.[0]?.id : undefined)} label="Live Preview" />
            </Row>

            <Row gap={8}>
              <div className="hint">Align</div>
              <IconButton variant="outline" title="Align Left" onClick={() => alignSelected('left')}>L</IconButton>
              <IconButton variant="outline" title="Align Center" onClick={() => alignSelected('center')}>C</IconButton>
              <IconButton variant="outline" title="Align Right" onClick={() => alignSelected('right')}>R</IconButton>
              <IconButton variant="outline" title="Align Top" onClick={() => alignSelected('top')}>T</IconButton>
              <IconButton variant="outline" title="Align Middle" onClick={() => alignSelected('middle')}>M</IconButton>
              <IconButton variant="outline" title="Align Bottom" onClick={() => alignSelected('bottom')}>B</IconButton>
              <div style={{ marginLeft: 'auto' }}>
              <IconButton variant="outline" title="Undo" onClick={undo}>Undo</IconButton>
              <IconButton variant="outline" title="Redo" onClick={redo}>Redo</IconButton>
              </div>
            </Row>

            <EditorCanvas
              blueprint={blueprint}
              elements={elements}
              selectedId={selectedId}
              gridSize={gridSize}
              snapToGrid={snapToGrid}
              zoom={zoom}
              previewData={previewRow}
              onSelect={setSelectedId}
              onChange={(next) => updateElements(next)}
              onZoomChange={setZoom}
            />
          </div>
        </Panel>

        <Panel title="Properties" subtitle={selected ? selected.name : 'Select an element'}>
          {!selected ? (
            <div className="empty">
              Select an element to edit its properties. Text supports bindings like <code>{'{{name}}'}</code>.
            </div>
          ) : (
            <div className="list">
              <div>
                <div className="hint">Name</div>
                <Input value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} />
              </div>

              <Row gap={10}>
                <div style={{ flex: 1 }}>
                  <div className="hint">X</div>
                  <Input type="number" value={selected.x} onChange={(e) => updateSelected({ x: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="hint">Y</div>
                  <Input type="number" value={selected.y} onChange={(e) => updateSelected({ y: Number(e.target.value) })} />
                </div>
              </Row>
              <Row gap={10}>
                <div style={{ flex: 1 }}>
                  <div className="hint">W</div>
                  <Input type="number" value={selected.w} onChange={(e) => updateSelected({ w: Math.max(10, Number(e.target.value)) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="hint">H</div>
                  <Input type="number" value={selected.h} onChange={(e) => updateSelected({ h: Math.max(10, Number(e.target.value)) })} />
                </div>
              </Row>
              <Row gap={10}>
                <div style={{ flex: 1 }}>
                  <div className="hint">Rotation</div>
                  <Input type="number" value={selected.rotation} onChange={(e) => updateSelected({ rotation: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="hint">Opacity</div>
                  <Input type="number" value={selected.opacity ?? 1} step={0.1} min={0} max={1} onChange={(e) => updateSelected({ opacity: Number(e.target.value) })} />
                </div>
              </Row>

              {selected.type === 'text' || selected.type === 'image' ? (
                <div>
                  <div className="hint">Binding Key</div>
                  <Input value={selected.bindingKey ?? ''} onChange={(e) => updateSelected({ bindingKey: e.target.value })} placeholder="name" />
                </div>
              ) : null}

              {selected.type === 'text' ? (
                <>
                  <div>
                    <div className="hint">Text</div>
                    <Input value={selected.text} onChange={(e) => updateSelected({ text: e.target.value })} />
                  </div>
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Font</div>
                      <Input value={selected.fontFamily ?? 'Segoe UI'} onChange={(e) => updateSelected({ fontFamily: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Size</div>
                      <Input type="number" value={selected.fontSize ?? 32} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} />
                    </div>
                  </Row>
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Color</div>
                      <Input value={selected.fill ?? '#ffffff'} onChange={(e) => updateSelected({ fill: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Align</div>
                      <Select value={selected.align ?? 'left'} onChange={(e) => updateSelected({ align: e.target.value as any })}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </Select>
                    </div>
                  </Row>
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Shadow</div>
                      <Input value={selected.shadowColor ?? '#000000'} onChange={(e) => updateSelected({ shadowColor: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Blur</div>
                      <Input type="number" value={selected.shadowBlur ?? 0} onChange={(e) => updateSelected({ shadowBlur: Number(e.target.value) })} />
                    </div>
                  </Row>
                </>
              ) : null}

              {selected.type === 'shape' ? (
                <>
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Fill</div>
                      <Input value={selected.fill ?? '#1f2a44'} onChange={(e) => updateSelected({ fill: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Stroke</div>
                      <Input value={selected.stroke ?? '#3b5b8a'} onChange={(e) => updateSelected({ stroke: e.target.value })} />
                    </div>
                  </Row>
                  <Row gap={10}>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Stroke W</div>
                      <Input type="number" value={selected.strokeWidth ?? 2} onChange={(e) => updateSelected({ strokeWidth: Number(e.target.value) })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hint">Radius</div>
                      <Input type="number" value={selected.radius ?? 0} onChange={(e) => updateSelected({ radius: Number(e.target.value) })} />
                    </div>
                  </Row>
                </>
              ) : null}

              {selected.type === 'image' ? (
                <>
                  <div className="hint">Image Source</div>
                  <Input value={selected.src ?? ''} onChange={(e) => updateSelected({ src: e.target.value })} />
                </>
              ) : null}

              {selected.type === 'icon' ? (
                <>
                  <div className="hint">Icon Label</div>
                  <Input value={selected.iconName ?? 'ICON'} onChange={(e) => updateSelected({ iconName: e.target.value })} />
                </>
              ) : null}

              <Button variant="danger" onClick={() => updateElements(elements.filter((el) => el.id !== selected.id))}>
                Delete Element
              </Button>
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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
