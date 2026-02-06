import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group } from 'react-konva';
import Konva from 'konva';
import type { Blueprint, ElementModel } from '../../../../../packages/core/src/index';
import { applyBindingsToElements } from '../../../../../packages/core/src/index';
import { useHtmlImage } from '../../utils/konva';
import { getImageLayout } from '../../utils/imageFit';

export type ExportCanvasHandle = {
  renderToDataUrl: (rowData: Record<string, any>, pixelRatio: number) => Promise<string | null>;
};

export const ExportCanvas = forwardRef<
  ExportCanvasHandle,
  { blueprint: Blueprint; projectRoot?: string }
>((props, ref) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [rowData, setRowData] = useState<Record<string, any>>({});

  useImperativeHandle(ref, () => ({
    renderToDataUrl: async (data: Record<string, any>, pixelRatio: number) => {
      setRowData(data);
      await nextFrame();
      const stage = stageRef.current;
      if (!stage) return null;
      return stage.toDataURL({ pixelRatio });
    },
  }));

  const elements = applyBindingsToElements(props.blueprint.elements, rowData);

  return (
    <div style={{ width: 0, height: 0, overflow: 'hidden' }}>
      <Stage ref={stageRef} width={props.blueprint.size.w} height={props.blueprint.size.h}>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={props.blueprint.size.w}
            height={props.blueprint.size.h}
            fill={props.blueprint.background ?? '#0e1830'}
            cornerRadius={18}
          />
          {elements
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => renderStaticElement(el, props.projectRoot))}
        </Layer>
      </Stage>
    </div>
  );
});

function renderStaticElement(el: ElementModel, projectRoot?: string) {
  if (!el.visible) return null;
  if (el.type === 'shape') {
    return (
      <Rect
        key={el.id}
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
      />
    );
  }
  if (el.type === 'text') {
    return (
      <Text
        key={el.id}
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
      />
    );
  }
  if (el.type === 'icon') {
    return (
      <Text
        key={el.id}
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
        fill={el.fill ?? '#fff'}
        opacity={el.opacity ?? 1}
      />
    );
  }
  if (el.type === 'image') {
    return <StaticImage key={el.id} el={el} projectRoot={projectRoot} />;
  }
  return null;
}

function StaticImage({ el, projectRoot }: { el: ElementModel; projectRoot?: string }) {
  const img = useHtmlImage((el as any).src, projectRoot);
  const item = el as any;
  const layout = getImageLayout(img, item.w, item.h, item.fit);
  return (
    <Group
      x={item.x}
      y={item.y}
      rotation={item.rotation}
      opacity={item.opacity ?? 1}
      clipX={0}
      clipY={0}
      clipWidth={item.w}
      clipHeight={item.h}
    >
      <Rect width={item.w} height={item.h} opacity={0} />
      <KonvaImage
        image={img ?? undefined}
        x={layout.x}
        y={layout.y}
        width={layout.width}
        height={layout.height}
      />
    </Group>
  );
}

function isBold(weight?: number | string) {
  if (weight == null) return false;
  if (typeof weight === 'number') return weight >= 600;
  return String(weight).toLowerCase() === 'bold';
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
