import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Blueprint, ElementModel } from '@cardsmith/core';
import { applyBindingsToElements } from '@cardsmith/core';
import { useHtmlImage } from '../../utils/konva';

type Props = {
  blueprint: Blueprint;
  elements: ElementModel[];
  selectedId: string | null;
  gridSize: number;
  snapToGrid: boolean;
  zoom: number;
  previewData?: Record<string, any>;
  onSelect: (id: string | null) => void;
  onChange: (elements: ElementModel[]) => void;
  onZoomChange: (zoom: number) => void;
};

export function EditorCanvas(props: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);

  const renderElements = useMemo(() => {
    if (!props.previewData) return props.elements;
    return applyBindingsToElements(props.elements, props.previewData);
  }, [props.elements, props.previewData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const selectedNode = useMemo(() => {
    const stage = stageRef.current;
    if (!stage || !props.selectedId) return null;
    return stage.findOne(`#${props.selectedId}`) as Konva.Node | null;
  }, [props.selectedId, renderElements]);

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (selectedNode) {
      tr.nodes([selectedNode]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedNode]);

  const snap = (value: number) =>
    props.snapToGrid ? Math.round(value / props.gridSize) * props.gridSize : value;

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
    const newScale = evt.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    props.onZoomChange(Math.min(2.5, Math.max(0.3, Number(newScale.toFixed(2)))));
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePos(newPos);
  };

  return (
    <div className="canvas-shell">
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
        onMouseDown={(e) => {
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) props.onSelect(null);
        }}
        style={{
          borderRadius: 14,
          background: '#0d1424',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        }}
      >
        <Layer listening={false}>
          {renderGrid(props.blueprint.size.w, props.blueprint.size.h, props.gridSize)}
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
                    onClick={() => props.onSelect(el.id)}
                    onTap={() => props.onSelect(el.id)}
                    onDragEnd={(e) => updateElement(el.id, { x: snap(e.target.x()), y: snap(e.target.y()) })}
                    onTransformEnd={(e) => {
                      const node = e.target as Konva.Rect;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateElement(el.id, {
                        x: snap(node.x()),
                        y: snap(node.y()),
                        w: Math.max(10, node.width() * scaleX),
                        h: Math.max(10, node.height() * scaleY),
                        rotation: node.rotation(),
                      });
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
                    fontStyle={isBold(el.fontWeight) ? 'bold' : el.fontStyle ?? 'normal'}
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
                    onClick={() => props.onSelect(el.id)}
                    onTap={() => props.onSelect(el.id)}
                    onDragEnd={(e) => updateElement(el.id, { x: snap(e.target.x()), y: snap(e.target.y()) })}
                    onTransformEnd={(e) => {
                      const node = e.target as Konva.Text;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateElement(el.id, {
                        x: snap(node.x()),
                        y: snap(node.y()),
                        w: Math.max(10, node.width() * scaleX),
                        h: Math.max(10, node.height() * scaleY),
                        rotation: node.rotation(),
                      });
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
                    onClick={() => props.onSelect(el.id)}
                    onTap={() => props.onSelect(el.id)}
                    onDragEnd={(e) => updateElement(el.id, { x: snap(e.target.x()), y: snap(e.target.y()) })}
                    onTransformEnd={(e) => {
                      const node = e.target as Konva.Text;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();
                      node.scaleX(1);
                      node.scaleY(1);
                      updateElement(el.id, {
                        x: snap(node.x()),
                        y: snap(node.y()),
                        w: Math.max(10, node.width() * scaleX),
                        h: Math.max(10, node.height() * scaleY),
                        rotation: node.rotation(),
                      });
                    }}
                  />
                );
              }

              if (el.type === 'image') {
                return (
                  <ImageNode
                    key={el.id}
                    el={el}
                    onSelect={props.onSelect}
                    onUpdate={updateElement}
                    snap={snap}
                  />
                );
              }

              return null;
            })}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            borderStroke="rgba(110,231,210,0.8)"
            anchorStroke="rgba(110,231,210,0.9)"
            anchorFill="rgba(0,0,0,0.8)"
            anchorSize={10}
          />
        </Layer>
      </Stage>
    </div>
  );
}

function renderGrid(w: number, h: number, step: number) {
  const lines: React.ReactNode[] = [];
  for (let x = step; x < w; x += step) {
    lines.push(<Rect key={`vx-${x}`} x={x} y={0} width={1} height={h} fill="rgba(255,255,255,0.04)" />);
  }
  for (let y = step; y < h; y += step) {
    lines.push(<Rect key={`hy-${y}`} x={0} y={y} width={w} height={1} fill="rgba(255,255,255,0.04)" />);
  }
  return lines;
}

function ImageNode(props: {
  el: ElementModel;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ElementModel>) => void;
  snap: (value: number) => number;
}) {
  const img = useHtmlImage((props.el as any).src);
  const el = props.el as any;
  return (
    <KonvaImage
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.w}
      height={el.h}
      rotation={el.rotation}
      image={img ?? undefined}
      opacity={el.opacity ?? 1}
      draggable={!el.locked}
      onClick={() => props.onSelect(el.id)}
      onTap={() => props.onSelect(el.id)}
      onDragEnd={(e) => props.onUpdate(el.id, { x: props.snap(e.target.x()), y: props.snap(e.target.y()) })}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Image;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        props.onUpdate(el.id, {
          x: props.snap(node.x()),
          y: props.snap(node.y()),
          w: Math.max(10, node.width() * scaleX),
          h: Math.max(10, node.height() * scaleY),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

function isBold(weight?: number | string) {
  if (weight == null) return false;
  if (typeof weight === 'number') return weight >= 600;
  return String(weight).toLowerCase() === 'bold';
}
