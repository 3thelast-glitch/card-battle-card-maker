import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KonvaImage,
  Transformer,
  Line,
  Group,
} from 'react-konva';
import Konva from 'konva';
import type {
  Blueprint,
  ElementModel,
} from '../../../../../packages/core/src/index';
import { applyBindingsToElements } from '../../../../../packages/core/src/index';
import { useHtmlImage } from '../../utils/konva';
import { getImageLayout } from '../../utils/imageFit';

type Props = {
  blueprint: Blueprint;
  elements: ElementModel[];
  selectedIds: string[];
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  zoom: number;
  projectRoot?: string;
  previewData?: Record<string, any>;
  onSelectIds: (ids: string[]) => void;
  onChange: (elements: ElementModel[]) => void;
  onZoomChange: (zoom: number) => void;
  onDropAsset?: (
    asset: DroppedAsset,
    position: { x: number; y: number },
  ) => void;
};

type GuideLine = {
  orientation: 'V' | 'H';
  position: number;
};

type DragStart = {
  id: string;
  positions: Record<string, { x: number; y: number }>;
};

type DroppedAsset = {
  src: string;
  name: string;
};

const SNAP_THRESHOLD = 6;

export function EditorCanvas(props: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    visible: false,
  });
  const selectionStartRef = useRef<{
    x: number;
    y: number;
    additive: boolean;
  } | null>(null);
  const selectionJustFinishedRef = useRef(false);
  const dragStartRef = useRef<DragStart | null>(null);
  const draggingIdRef = useRef<string | null>(null);

  const renderElements = useMemo(() => {
    if (!props.previewData) return props.elements;
    return applyBindingsToElements(props.elements, props.previewData);
  }, [props.elements, props.previewData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(true);
      if (e.key === 'Shift') setShiftDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false);
      if (e.key === 'Shift') setShiftDown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const selectedNodes = useMemo(() => {
    const stage = stageRef.current;
    if (!stage) return [];
    return props.selectedIds
      .map((id) => stage.findOne(`#${id}`) as Konva.Node | null)
      .filter(Boolean) as Konva.Node[];
  }, [props.selectedIds, renderElements]);

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    tr.nodes(selectedNodes);
    tr.rotateEnabled(selectedNodes.length === 1);
    tr.enabledAnchors(
      selectedNodes.length === 1
        ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
        : [],
    );
    tr.getLayer()?.batchDraw();
  }, [selectedNodes]);

  const keepRatio = useMemo(() => {
    if (shiftDown) return true;
    if (props.selectedIds.length !== 1) return false;
    const selected = props.elements.find(
      (el) => el.id === props.selectedIds[0],
    );
    if (!selected || selected.type !== 'image') return false;
    return Boolean((selected as any).lockRatio);
  }, [shiftDown, props.selectedIds, props.elements]);

  const snap = (value: number) =>
    props.snapToGrid
      ? Math.round(value / props.gridSize) * props.gridSize
      : value;

  const updateElement = (id: string, patch: Partial<ElementModel>) => {
    props.onChange(
      props.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    );
  };

  const handleWheel = (evt: Konva.KonvaEventObject<WheelEvent>) => {
    if (!evt.evt.ctrlKey) return;
    evt.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = evt.target.getStage();
    if (!stage) return;
    const oldScale = props.zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const newScale =
      evt.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    props.onZoomChange(
      Math.min(2.5, Math.max(0.3, Number(newScale.toFixed(2)))),
    );
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePos(newPos);
  };

  const getPointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - stagePos.x) / props.zoom,
      y: (pointer.y - stagePos.y) / props.zoom,
    };
  };

  const startMarqueeSelection = (evt: Konva.KonvaEventObject<MouseEvent>) => {
    if (spaceDown) return;
    const stage = evt.target.getStage();
    if (!stage) return;
    if (evt.target !== stage) return;
    const pos = getPointerPosition();
    if (!pos) return;
    const additive = evt.evt.shiftKey;
    selectionStartRef.current = { x: pos.x, y: pos.y, additive };
    setSelectionRect({ x: pos.x, y: pos.y, w: 0, h: 0, visible: true });
    if (!additive) props.onSelectIds([]);
  };

  const updateMarqueeSelection = () => {
    if (!selectionStartRef.current) return;
    const pos = getPointerPosition();
    if (!pos) return;
    const start = selectionStartRef.current;
    const x = Math.min(start.x, pos.x);
    const y = Math.min(start.y, pos.y);
    const w = Math.abs(start.x - pos.x);
    const h = Math.abs(start.y - pos.y);
    setSelectionRect({ x, y, w, h, visible: true });
  };

  const finishMarqueeSelection = () => {
    if (!selectionStartRef.current) return;
    const rect = selectionRect;
    const additive = selectionStartRef.current.additive;
    selectionStartRef.current = null;
    selectionJustFinishedRef.current = true;
    setSelectionRect({ ...rect, visible: false });

    const selected = props.elements
      .filter((el) => el.visible !== false && !el.locked)
      .filter((el) =>
        rectsIntersect(rect, { x: el.x, y: el.y, w: el.w, h: el.h }),
      )
      .map((el) => el.id);

    if (additive) {
      const merged = Array.from(new Set([...props.selectedIds, ...selected]));
      props.onSelectIds(merged);
    } else {
      props.onSelectIds(selected);
    }
  };

  const setGuidesForNode = (node: Konva.Node, skipId: string) => {
    if (!props.snapToGrid) {
      setGuides([]);
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const lineGuideStops = getLineGuideStops(
      props.elements,
      props.blueprint,
      props.gridSize,
      skipId,
      props.snapToGrid,
    );
    const itemBounds = getObjectSnappingEdges(node, stage);
    const nextGuides = getGuides(lineGuideStops, itemBounds);

    if (!nextGuides.length) {
      setGuides([]);
      return;
    }

    const absPos = node.absolutePosition();
    nextGuides.forEach((guide) => {
      if (guide.orientation === 'V') {
        absPos.x = guide.lineGuide + guide.offset;
      } else {
        absPos.y = guide.lineGuide + guide.offset;
      }
    });
    node.absolutePosition(absPos);

    setGuides(
      nextGuides.map((g) => ({
        orientation: g.orientation,
        position: g.lineGuide,
      })),
    );
  };

  const onDragStart = (id: string) => {
    const isMulti = props.selectedIds.includes(id);
    if (!isMulti) {
      props.onSelectIds([id]);
    }
    const positions: Record<string, { x: number; y: number }> = {};
    const selectionIds = isMulti ? props.selectedIds : [id];
    selectionIds.forEach((selId) => {
      const el = props.elements.find((item) => item.id === selId);
      if (el) positions[selId] = { x: el.x, y: el.y };
    });
    dragStartRef.current = { id, positions };
    draggingIdRef.current = id;
  };

  const onDragMove = (id: string, node: Konva.Node) => {
    if (draggingIdRef.current !== id) return;
    setGuidesForNode(node, id);

    if (props.snapToGrid) {
      node.position({ x: snap(node.x()), y: snap(node.y()) });
    }

    const start = dragStartRef.current;
    if (!start || Object.keys(start.positions).length <= 1) return;

    const origin = start.positions[id];
    if (!origin) return;
    const dx = node.x() - origin.x;
    const dy = node.y() - origin.y;
    const updated = props.elements.map((el) => {
      if (!start.positions[el.id]) return el;
      const initial = start.positions[el.id] ?? { x: el.x, y: el.y };
      return { ...el, x: initial.x + dx, y: initial.y + dy };
    });
    props.onChange(updated);
  };

  const onDragEnd = (id: string, node: Konva.Node) => {
    setGuides([]);
    const start = dragStartRef.current;
    dragStartRef.current = null;
    draggingIdRef.current = null;
    if (!start) return;
    const origin = start.positions[id];
    if (!origin) return;
    const dx = snap(node.x()) - origin.x;
    const dy = snap(node.y()) - origin.y;
    const updated = props.elements.map((el) => {
      if (!start.positions[el.id]) return el;
      const initial = start.positions[el.id] ?? { x: el.x, y: el.y };
      return { ...el, x: initial.x + dx, y: initial.y + dy };
    });
    props.onChange(updated);
  };

  const handleSelect = (el: ElementModel, additive: boolean) => {
    if (el.locked) return;
    if (additive) {
      if (props.selectedIds.includes(el.id)) {
        props.onSelectIds(props.selectedIds.filter((id) => id !== el.id));
      } else {
        props.onSelectIds([...props.selectedIds, el.id]);
      }
      return;
    }
    props.onSelectIds([el.id]);
  };

  const handleExternalDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!props.onDropAsset) return;
    const payload = event.dataTransfer.getData('application/x-cardsmith-asset');
    if (!payload) return;
    try {
      const asset = JSON.parse(payload) as DroppedAsset;
      const stage = stageRef.current;
      if (!stage) return;
      stage.setPointersPositions(event.nativeEvent);
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const point = transform.point(pos);
      props.onDropAsset(asset, { x: point.x, y: point.y });
    } catch {
      return;
    }
  };

  return (
    <div
      className="canvas-shell"
      onDragOver={(event) => {
        if (props.onDropAsset) event.preventDefault();
      }}
      onDrop={handleExternalDrop}
    >
      <Stage
        ref={stageRef}
        width={props.blueprint.size.w}
        height={props.blueprint.size.h}
        scaleX={props.zoom}
        scaleY={props.zoom}
        x={stagePos.x}
        y={stagePos.y}
        draggable={spaceDown}
        onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
        onWheel={handleWheel}
        onMouseDown={startMarqueeSelection}
        onMouseMove={updateMarqueeSelection}
        onMouseUp={finishMarqueeSelection}
        onMouseLeave={finishMarqueeSelection}
        onClick={(e) => {
          if (selectionJustFinishedRef.current) {
            selectionJustFinishedRef.current = false;
            return;
          }
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty && !selectionRect.visible) props.onSelectIds([]);
        }}
        style={{
          borderRadius: 'var(--r-md)',
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid var(--stroke)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <Layer listening={false}>
          {props.showGrid
            ? renderGrid(
                props.blueprint.size.w,
                props.blueprint.size.h,
                props.gridSize,
              )
            : null}
        </Layer>
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={props.blueprint.size.w}
            height={props.blueprint.size.h}
            fill={props.blueprint.background ?? '#0e1830'}
            cornerRadius={18}
          />
        </Layer>
        <Layer>
          {renderElements
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => {
              if (!el.visible) return null;

              if (el.type === 'shape') {
                return (
                  <Rect
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.w}
                    height={el.h}
                    rotation={el.rotation}
                    fill={el.fill ?? '#1f2a44'}
                    stroke={el.stroke ?? '#3b5b8a'}
                    strokeWidth={el.strokeWidth ?? 2}
                    cornerRadius={el.radius ?? 0}
                    opacity={el.opacity ?? 1}
                    draggable={!el.locked}
                    onClick={(e) => handleSelect(el, e.evt.shiftKey)}
                    onTap={(e) => handleSelect(el, e.evt.shiftKey)}
                    onDragStart={() => onDragStart(el.id)}
                    onDragMove={(e) => onDragMove(el.id, e.target)}
                    onDragEnd={(e) => onDragEnd(el.id, e.target)}
                    onTransformEnd={(e) => {
                      if (props.selectedIds.length > 1) return;
                      const node = e.target as Konva.Rect;
                      updateElement(el.id, applyTransform(el, node, snap));
                    }}
                  />
                );
              }

              if (el.type === 'text') {
                return (
                  <Text
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.w}
                    height={el.h}
                    rotation={el.rotation}
                    text={el.text ?? ''}
                    fontSize={el.fontSize ?? 32}
                    fontFamily={el.fontFamily ?? 'Segoe UI'}
                    fontStyle={
                      isBold(el.fontWeight)
                        ? 'bold'
                        : (el.fontStyle ?? 'normal')
                    }
                    align={el.align ?? 'left'}
                    verticalAlign={el.verticalAlign ?? 'top'}
                    fill={el.fill ?? '#fff'}
                    lineHeight={el.lineHeight ?? 1.1}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    shadowColor={el.shadowColor}
                    shadowBlur={el.shadowBlur}
                    shadowOffsetX={el.shadowOffsetX}
                    shadowOffsetY={el.shadowOffsetY}
                    shadowOpacity={el.shadowOpacity}
                    opacity={el.opacity ?? 1}
                    draggable={!el.locked}
                    onClick={(e) => handleSelect(el, e.evt.shiftKey)}
                    onTap={(e) => handleSelect(el, e.evt.shiftKey)}
                    onDragStart={() => onDragStart(el.id)}
                    onDragMove={(e) => onDragMove(el.id, e.target)}
                    onDragEnd={(e) => onDragEnd(el.id, e.target)}
                    onTransformEnd={(e) => {
                      if (props.selectedIds.length > 1) return;
                      const node = e.target as Konva.Text;
                      updateElement(el.id, applyTransform(el, node, snap));
                    }}
                  />
                );
              }

              if (el.type === 'icon') {
                return (
                  <Text
                    key={el.id}
                    id={el.id}
                    x={el.x}
                    y={el.y}
                    width={el.w}
                    height={el.h}
                    rotation={el.rotation}
                    text={el.iconName ?? 'ICON'}
                    fontSize={el.fontSize ?? 32}
                    fontFamily="Segoe UI"
                    align="center"
                    verticalAlign="middle"
                    fill={el.fill ?? '#ffffff'}
                    opacity={el.opacity ?? 1}
                    draggable={!el.locked}
                    onClick={(e) => handleSelect(el, e.evt.shiftKey)}
                    onTap={(e) => handleSelect(el, e.evt.shiftKey)}
                    onDragStart={() => onDragStart(el.id)}
                    onDragMove={(e) => onDragMove(el.id, e.target)}
                    onDragEnd={(e) => onDragEnd(el.id, e.target)}
                    onTransformEnd={(e) => {
                      if (props.selectedIds.length > 1) return;
                      const node = e.target as Konva.Text;
                      updateElement(el.id, applyTransform(el, node, snap));
                    }}
                  />
                );
              }

              if (el.type === 'image') {
                return (
                  <ImageNode
                    key={el.id}
                    el={el}
                    onSelect={handleSelect}
                    onUpdate={updateElement}
                    onDragStart={onDragStart}
                    onDragMove={onDragMove}
                    onDragEnd={onDragEnd}
                    snap={snap}
                    multiSelected={props.selectedIds.length > 1}
                    projectRoot={props.projectRoot}
                  />
                );
              }

              return null;
            })}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio={keepRatio}
            borderStroke="rgba(110,231,210,0.8)"
            anchorStroke="rgba(110,231,210,0.9)"
            anchorFill="rgba(0,0,0,0.8)"
            anchorSize={10}
          />
        </Layer>
        <Layer listening={false}>
          {guides.map((guide) =>
            guide.orientation === 'V' ? (
              <Line
                key={`gv-${guide.position}`}
                points={[
                  guide.position,
                  0,
                  guide.position,
                  props.blueprint.size.h,
                ]}
                stroke="#38bdf8"
                strokeWidth={1}
                dash={[4, 4]}
              />
            ) : (
              <Line
                key={`gh-${guide.position}`}
                points={[
                  0,
                  guide.position,
                  props.blueprint.size.w,
                  guide.position,
                ]}
                stroke="#38bdf8"
                strokeWidth={1}
                dash={[4, 4]}
              />
            ),
          )}
          {selectionRect.visible ? (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.w}
              height={selectionRect.h}
              fill="rgba(56,189,248,0.12)"
              stroke="rgba(56,189,248,0.9)"
              strokeWidth={1}
              dash={[6, 4]}
            />
          ) : null}
        </Layer>
      </Stage>
    </div>
  );
}

function renderGrid(w: number, h: number, step: number) {
  const lines: React.ReactNode[] = [];
  for (let x = step; x < w; x += step) {
    lines.push(
      <Rect
        key={`vx-${x}`}
        x={x}
        y={0}
        width={1}
        height={h}
        fill="rgba(255,255,255,0.04)"
      />,
    );
  }
  for (let y = step; y < h; y += step) {
    lines.push(
      <Rect
        key={`hy-${y}`}
        x={0}
        y={y}
        width={w}
        height={1}
        fill="rgba(255,255,255,0.04)"
      />,
    );
  }
  return lines;
}

function getLineGuideStops(
  elements: ElementModel[],
  blueprint: Blueprint,
  gridSize: number,
  skipId: string,
  snapEnabled: boolean,
) {
  const vertical = [0, blueprint.size.w / 2, blueprint.size.w];
  const horizontal = [0, blueprint.size.h / 2, blueprint.size.h];

  if (snapEnabled) {
    for (let x = 0; x <= blueprint.size.w; x += gridSize) vertical.push(x);
    for (let y = 0; y <= blueprint.size.h; y += gridSize) horizontal.push(y);
  }

  elements.forEach((el) => {
    if (el.id === skipId || el.visible === false) return;
    vertical.push(el.x, el.x + el.w / 2, el.x + el.w);
    horizontal.push(el.y, el.y + el.h / 2, el.y + el.h);
  });

  return { vertical, horizontal };
}

function getObjectSnappingEdges(node: Konva.Node, stage: Konva.Stage) {
  const box = node.getClientRect({ relativeTo: stage });
  const absPos = node.absolutePosition();
  return {
    vertical: [
      { guide: box.x, offset: absPos.x - box.x },
      {
        guide: box.x + box.width / 2,
        offset: absPos.x - box.x - box.width / 2,
      },
      { guide: box.x + box.width, offset: absPos.x - box.x - box.width },
    ],
    horizontal: [
      { guide: box.y, offset: absPos.y - box.y },
      {
        guide: box.y + box.height / 2,
        offset: absPos.y - box.y - box.height / 2,
      },
      { guide: box.y + box.height, offset: absPos.y - box.y - box.height },
    ],
  };
}

function getGuides(
  lineGuideStops: { vertical: number[]; horizontal: number[] },
  itemBounds: {
    vertical: { guide: number; offset: number }[];
    horizontal: { guide: number; offset: number }[];
  },
) {
  const guides: {
    orientation: 'V' | 'H';
    lineGuide: number;
    offset: number;
  }[] = [];

  let minV = SNAP_THRESHOLD + 1;
  lineGuideStops.vertical.forEach((lineGuide) => {
    itemBounds.vertical.forEach((itemBound) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < SNAP_THRESHOLD && diff < minV) {
        minV = diff;
        guides[0] = { orientation: 'V', lineGuide, offset: itemBound.offset };
      }
    });
  });

  let minH = SNAP_THRESHOLD + 1;
  lineGuideStops.horizontal.forEach((lineGuide) => {
    itemBounds.horizontal.forEach((itemBound) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < SNAP_THRESHOLD && diff < minH) {
        minH = diff;
        guides[1] = { orientation: 'H', lineGuide, offset: itemBound.offset };
      }
    });
  });

  return guides.filter(Boolean);
}

function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return (
    a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y
  );
}

function ImageNode(props: {
  el: ElementModel;
  onSelect: (el: ElementModel, additive: boolean) => void;
  onUpdate: (id: string, patch: Partial<ElementModel>) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, node: Konva.Node) => void;
  onDragEnd: (id: string, node: Konva.Node) => void;
  snap: (value: number) => number;
  multiSelected: boolean;
  projectRoot?: string;
}) {
  const img = useHtmlImage((props.el as any).src, props.projectRoot);
  const el = props.el as any;
  const layout = getImageLayout(img, el.w, el.h, el.fit);
  return (
    <Group
      id={el.id}
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      opacity={el.opacity ?? 1}
      draggable={!el.locked}
      clipX={0}
      clipY={0}
      clipWidth={el.w}
      clipHeight={el.h}
      onClick={(e) => props.onSelect(el, e.evt.shiftKey)}
      onTap={(e) => props.onSelect(el, e.evt.shiftKey)}
      onDragStart={() => props.onDragStart(el.id)}
      onDragMove={(e) => props.onDragMove(el.id, e.target)}
      onDragEnd={(e) => props.onDragEnd(el.id, e.target)}
      onTransformEnd={(e) => {
        if (props.multiSelected) return;
        const node = e.target as Konva.Group;
        props.onUpdate(el.id, applyTransform(el, node, props.snap));
      }}
    >
      <Rect width={el.w} height={el.h} opacity={0} listening={false} />
      <KonvaImage
        image={img ?? undefined}
        x={layout.x}
        y={layout.y}
        width={layout.width}
        height={layout.height}
        listening={false}
      />
    </Group>
  );
}

function isBold(weight?: number | string) {
  if (weight == null) return false;
  if (typeof weight === 'number') return weight >= 600;
  return String(weight).toLowerCase() === 'bold';
}

function applyTransform(
  el: ElementModel,
  node: Konva.Node,
  snap: (value: number) => number,
) {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  node.scaleX(1);
  node.scaleY(1);
  return {
    x: snap(node.x()),
    y: snap(node.y()),
    w: Math.max(10, el.w * scaleX),
    h: Math.max(10, el.h * scaleY),
    rotation: node.rotation(),
  };
}
