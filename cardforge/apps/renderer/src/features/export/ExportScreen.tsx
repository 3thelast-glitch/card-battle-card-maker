import React, { useRef, useState } from 'react';
import type { Blueprint, DataRow, Project } from '@cardsmith/core';
import { ExportService } from '@cardsmith/core';
import { getParentPath, joinPath } from '@cardsmith/storage';
import { Button, Panel, Row, Input, Select } from '../../components/ui';
import { dataUrlToArrayBuffer } from '../../utils/file';
import { useAppStore } from '../../state/appStore';
import { ExportCanvas, ExportCanvasHandle } from './ExportCanvas';
import { useTranslation } from 'react-i18next';

export function ExportScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { t } = useTranslation();
  const { project } = props;
  const { activeBlueprintId, activeTableId, setActiveBlueprintId, setActiveTableId, previewRowId } = useAppStore();
  const [outputFolder, setOutputFolder] = useState<string>('');
  const [pixelRatio, setPixelRatio] = useState(2);
  const [namingTemplate, setNamingTemplate] = useState('{{name}}_{{id}}');
  const [progress, setProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [running, setRunning] = useState(false);
  const exportRef = useRef<ExportCanvasHandle>(null);
  const serviceRef = useRef(new ExportService());

  const blueprint: Blueprint | undefined =
    project.blueprints.find((bp) => bp.id === activeBlueprintId) ?? project.blueprints[0];
  const dataTable = project.dataTables.find((table) => table.id === activeTableId) ?? project.dataTables[0];
  const rows: DataRow[] = dataTable?.rows ?? [];
  const projectRoot = project.meta.filePath ? getParentPath(project.meta.filePath) : undefined;

  const ready = Boolean(outputFolder && blueprint);

  const pickFolder = async () => {
    if (!window.cardsmith) return;
    const res = await window.cardsmith.selectFolder();
    if (res.canceled || !res.filePaths?.[0]) return;
    setOutputFolder(res.filePaths[0]);
  };

  const renderRow = async (row: DataRow, ratio: number) => {
    if (!exportRef.current || !blueprint) return null;
    return exportRef.current.renderToDataUrl(row.data, ratio);
  };

  const writeFile = async (fileName: string, dataUrl: string, current: number, total: number) => {
    if (!window.cardsmith) return;
    const buffer = dataUrlToArrayBuffer(dataUrl);
    const filePath = joinPath(outputFolder, fileName);
    await window.cardsmith.writeFile(filePath, { data: buffer });
    setProgress({ current, total, fileName });
  };

  const exportSingle = async () => {
    if (!ready || !rows.length) return;
    const row = rows.find((r) => r.id === previewRowId) ?? rows[0];
    const dataUrl = await renderRow(row, pixelRatio);
    if (!dataUrl) return;
    await writeFile('preview.png', dataUrl, 1, 1);
  };

  const exportBatch = async () => {
    if (!ready || !rows.length || !blueprint) return;
    setRunning(true);
    const service = serviceRef.current;
    await service.run(
      blueprint,
      rows,
      { namingTemplate, pixelRatio, fallbackName: 'card' },
      {
        render: async (row, _copyIndex, bp, options) => renderRow(row, options.pixelRatio),
        writeFile: async (fileName, dataUrl, progressInfo) => {
          await writeFile(fileName, dataUrl, progressInfo.current, progressInfo.total);
        },
        onComplete: () => setRunning(false),
      },
    );
  };

  const cancelExport = () => {
    serviceRef.current.cancel();
    setRunning(false);
  };

  return (
    <div className="screen" style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        <Panel title={t('export.title')} subtitle={t('export.subtitle')}>
          <div className="list">
            <Row gap={10}>
              <Button onClick={pickFolder}>{t('export.chooseFolder')}</Button>
              <div className="hint">{outputFolder || t('export.noFolder')}</div>
            </Row>
            <Row gap={10}>
              <div style={{ flex: 1 }}>
                <div className="hint">{t('export.blueprintLabel')}</div>
                <Select
                  value={blueprint?.id ?? ''}
                  onChange={(e) => setActiveBlueprintId(e.target.value)}
                >
                  {project.blueprints.map((bp) => (
                    <option key={bp.id} value={bp.id}>{bp.name}</option>
                  ))}
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="hint">{t('export.dataTableLabel')}</div>
                <Select
                  value={dataTable?.id ?? ''}
                  onChange={(e) => setActiveTableId(e.target.value)}
                >
                  {project.dataTables.map((table) => (
                    <option key={table.id} value={table.id}>{table.name}</option>
                  ))}
                </Select>
                <div className="hint" style={{ marginTop: 6 }}>{t('export.rows', { count: rows.length })}</div>
              </div>
            </Row>
            <Row gap={10}>
              <div style={{ flex: 1 }}>
                <div className="hint">{t('export.pixelRatio')}</div>
                <Input type="number" value={pixelRatio} min={1} max={4} step={0.5} onChange={(e) => setPixelRatio(Number(e.target.value))} />
              </div>
              <div style={{ flex: 2 }}>
                <div className="hint">{t('export.fileNaming')}</div>
                <Input value={namingTemplate} onChange={(e) => setNamingTemplate(e.target.value)} />
              </div>
            </Row>
            <Row gap={10}>
              <Button onClick={exportSingle} disabled={!ready || running || !rows.length}>{t('export.exportSingle')}</Button>
              <Button variant="outline" onClick={exportBatch} disabled={!ready || running || !rows.length}>{t('export.exportBatch')}</Button>
              {running ? <Button variant="danger" onClick={cancelExport}>{t('export.cancel')}</Button> : null}
            </Row>
            {progress ? (
              <div>
                <div className="hint">{t('export.exporting', { current: progress.current, total: progress.total, file: progress.fileName })}</div>
                <div className="progress-bar">
                  <div style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} />
                </div>
              </div>
            ) : (
              <div className="empty">{t('export.idle')}</div>
            )}
          </div>
        </Panel>

        <Panel title={t('export.previewTitle')} subtitle={t('export.previewSubtitle')}>
          <div className="empty">
            {t('export.previewHint')} <code>{'{{name}}_{{id}}'}</code>.
          </div>
        </Panel>
      </div>

      {blueprint ? <ExportCanvas ref={exportRef} blueprint={blueprint} projectRoot={projectRoot} /> : null}
    </div>
  );
}
