import React, { useRef, useState } from 'react';
import type {
  Blueprint,
  DataRow,
  Project,
} from '../../../../../packages/core/src/index';
import {
  ExportService,
  expandRowsWithQuantity,
  resolvePath,
} from '../../../../../packages/core/src/index';
import {
  getParentPath,
  joinPath,
} from '../../../../../packages/storage/src/index';
import { Button, Panel, Row, Input, Select } from '../../components/ui';
import { dataUrlToArrayBuffer } from '../../utils/file';
import { useAppStore } from '../../state/appStore';
import { ExportCanvas, ExportCanvasHandle } from './ExportCanvas';
import { useTranslation } from 'react-i18next';
import {
  getImageBindingDefaults,
  resolveImageReference,
} from '../../utils/imageBinding';
import { captureVideoPosterFromUrl } from '../../lib/videoPoster';
import { buildGameExport } from '../../lib/exportToGame';
import { exportToGameZip } from '../../lib/exportToGameZip';

type ExportReport = {
  total: number;
  missingImages: { rowId: string; expected: string }[];
  failures: { rowId: string; error: string }[];
};

export function ExportScreen(props: {
  project: Project;
  onChange: (project: Project) => void;
}) {
  const { t, i18n } = useTranslation();
  const { project } = props;
  const {
    activeBlueprintId,
    activeTableId,
    setActiveBlueprintId,
    setActiveTableId,
    previewRowId,
  } = useAppStore();
  const [outputFolder, setOutputFolder] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'json'>(
    'png',
  );
  const [pixelRatio, setPixelRatio] = useState(2);
  const [namingTemplate, setNamingTemplate] = useState('{{name}}_{{id}}');
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [zipRunning, setZipRunning] = useState(false);
  const [zipNotice, setZipNotice] = useState<string | null>(null);
  const [projectName, setProjectName] = useState(
    project.meta?.name || t('project.untitled'),
  );
  const [report, setReport] = useState<ExportReport | null>(null);
  const exportRef = useRef<ExportCanvasHandle>(null);
  const serviceRef = useRef(new ExportService());

  const blueprint: Blueprint | undefined =
    project.blueprints.find((bp) => bp.id === activeBlueprintId) ??
    project.blueprints[0];
  const dataTable =
    project.dataTables.find((table) => table.id === activeTableId) ??
    project.dataTables[0];
  const rows: DataRow[] = dataTable?.rows ?? [];
  const projectRoot = project.meta.filePath
    ? getParentPath(project.meta.filePath)
    : undefined;
  const imageBinding = getImageBindingDefaults(dataTable?.imageBinding);
  const missingPosterCount = rows.filter(
    (row) => row.art?.kind === 'video' && !row.art.poster,
  ).length;
  const missingFieldsCount = rows.filter(
    (row) => !hasRequiredFields(row.data),
  ).length;

  const ready = Boolean(outputFolder && blueprint);
  const busy = running || zipRunning;

  const pickFolder = async () => {
    if (!window.cardsmith) return;
    const res = await window.cardsmith.selectFolder();
    if (res.canceled || !res.filePaths?.[0]) return;
    setOutputFolder(res.filePaths[0]);
  };

  const resolveRowData = async (
    row: DataRow,
    onMissing?: (expected: string) => void,
  ) => {
    let art = row.art;
    if (art?.kind === 'video' && !art.poster) {
      try {
        const poster = await captureVideoPosterFromUrl(art.src);
        art = { ...art, poster };
      } catch {
        onMissing?.('poster');
      }
    }
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    const baseData = { ...row.data, ...(art ? { art } : {}), __lang: lang };
    if (!imageBinding.column) return baseData;
    const raw = resolvePath(baseData, imageBinding.column);
    const result = await resolveImageReference(raw, imageBinding, projectRoot);
    let resolved = result.resolved;
    if (result.missing) {
      const expected = result.expected ?? String(raw ?? imageBinding.column);
      onMissing?.(expected);
      resolved = imageBinding.placeholder || '';
    }
    if (resolved == null) return baseData;
    return setPathValue(baseData, imageBinding.column, resolved);
  };

  const renderRow = async (
    row: DataRow,
    ratio: number,
    onMissing?: (expected: string) => void,
  ) => {
    if (!exportRef.current || !blueprint) return null;
    const data = await resolveRowData(row, onMissing);
    return exportRef.current.renderToDataUrl(data, ratio);
  };

  const writeFile = async (
    fileName: string,
    dataUrl: string,
    current: number,
    total: number,
  ) => {
    if (!window.cardsmith) return;
    const buffer = dataUrlToArrayBuffer(dataUrl);
    const filePath = joinPath(outputFolder, fileName);
    await window.cardsmith.writeFile(filePath, { data: buffer });
    setProgress({ current, total, fileName });
  };

  const downloadBlob = (fileName: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const dataUrlToBlob = (dataUrl: string) => {
    const buffer = dataUrlToArrayBuffer(dataUrl);
    const match = dataUrl.match(/^data:(.*?);/);
    const mime = match?.[1] ?? 'application/octet-stream';
    return new Blob([buffer], { type: mime });
  };

  const exportToGame = () => {
    if (!rows.length) return;
    const result = buildGameExport(rows);
    downloadBlob(
      'cards.json',
      new Blob([result.cardsJson], { type: 'application/json' }),
    );
    result.assets
      .filter(
        (asset) =>
          asset.kind === 'poster' && asset.dataUrlOrUrl.startsWith('data:'),
      )
      .forEach((asset) => {
        downloadBlob(asset.name, dataUrlToBlob(asset.dataUrlOrUrl));
      });
  };

  const exportZip = async () => {
    if (!rows.length) return;
    setZipNotice(null);
    setZipRunning(true);
    try {
      const name = String(projectName || 'game-export').trim() || 'game-export';
      const blob = await exportToGameZip({ cards: rows, projectName: name });
      downloadBlob(`${name}.zip`, blob);
      setZipNotice(t('export.exportSuccess'));
    } catch (err: any) {
      setZipNotice(err?.message ?? 'Export failed');
    } finally {
      setZipRunning(false);
    }
  };

  const exportSingle = async () => {
    if (!ready || !rows.length || exportFormat !== 'png') return;
    const row = rows.find((r) => r.id === previewRowId) ?? rows[0];
    const dataUrl = await renderRow(row, pixelRatio);
    if (!dataUrl) return;
    await writeFile('preview.png', dataUrl, 1, 1);
  };

  const exportBatch = async () => {
    if (!ready || !rows.length || !blueprint || exportFormat !== 'png') return;
    setRunning(true);
    setReport(null);
    const service = serviceRef.current;
    const missingImages: { rowId: string; expected: string }[] = [];
    const missingKeys = new Set<string>();
    const failures: { rowId: string; error: string }[] = [];
    const total = expandRowsWithQuantity(rows).length;
    await service.run(
      blueprint,
      rows,
      { namingTemplate, pixelRatio, fallbackName: 'card' },
      {
        render: async (row, _copyIndex, _bp, options) => {
          try {
            return await renderRow(row, options.pixelRatio, (expected) => {
              const key = `${row.id}:${expected}`;
              if (missingKeys.has(key)) return;
              missingKeys.add(key);
              missingImages.push({ rowId: row.id, expected });
            });
          } catch (err: any) {
            failures.push({
              rowId: row.id,
              error: err?.message ?? 'RENDER_FAILED',
            });
            return null;
          }
        },
        writeFile: async (fileName, dataUrl, progressInfo) => {
          await writeFile(
            fileName,
            dataUrl,
            progressInfo.current,
            progressInfo.total,
          );
        },
        onComplete: () => {
          setRunning(false);
          setReport({ total, missingImages, failures });
        },
        onError: (error) => {
          failures.push({
            rowId: 'unknown',
            error: error.message ?? 'EXPORT_FAILED',
          });
          setRunning(false);
          setReport({ total, missingImages, failures });
        },
      },
    );
  };

  const cancelExport = () => {
    serviceRef.current.cancel();
    setRunning(false);
  };

  return (
    <div className="screen uiApp" style={{ padding: 16 }}>
      <div className="uiGrid two">
        <Panel title={t('ui.export.title')} subtitle={t('ui.export.sub')}>
          <div className="uiStack">
            <Row gap={10}>
              <Button onClick={pickFolder}>{t('export.chooseFolder')}</Button>
              <div className="uiHelp">
                {outputFolder || t('export.noFolder')}
              </div>
            </Row>
            <Row gap={10}>
              <div style={{ flex: 1 }}>
                <div className="uiHelp">{t('export.projectName')}</div>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
            </Row>
            <Row gap={10}>
              <div style={{ flex: 1 }}>
                <div className="uiHelp">{t('export.blueprintLabel')}</div>
                <Select
                  value={blueprint?.id ?? ''}
                  onChange={(e) => setActiveBlueprintId(e.target.value)}
                >
                  {project.blueprints.map((bp) => (
                    <option key={bp.id} value={bp.id}>
                      {bp.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="uiHelp">{t('export.dataTableLabel')}</div>
                <Select
                  value={dataTable?.id ?? ''}
                  onChange={(e) => setActiveTableId(e.target.value)}
                >
                  {project.dataTables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name}
                    </option>
                  ))}
                </Select>
                <div className="uiHelp" style={{ marginTop: 6 }}>
                  {t('export.rows', { count: rows.length })}
                </div>
              </div>
            </Row>
            <Row gap={10}>
              <div style={{ flex: 1 }}>
                <div className="uiHelp">{t('export.formatLabel')}</div>
                <Select
                  value={exportFormat}
                  onChange={(e) =>
                    setExportFormat(e.target.value as 'png' | 'pdf' | 'json')
                  }
                >
                  <option value="png">PNG</option>
                  <option value="pdf" disabled>
                    PDF
                  </option>
                  <option value="json">JSON</option>
                </Select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="uiHelp">{t('export.pixelRatio')}</div>
                <Input
                  type="number"
                  value={pixelRatio}
                  min={1}
                  max={4}
                  step={0.5}
                  disabled={exportFormat !== 'png'}
                  onChange={(e) => setPixelRatio(Number(e.target.value))}
                />
              </div>
            </Row>
            <Row gap={10}>
              <div style={{ flex: 1 }}>
                <div className="uiHelp">{t('export.fileNaming')}</div>
                <Input
                  value={namingTemplate}
                  disabled={exportFormat !== 'png'}
                  onChange={(e) => setNamingTemplate(e.target.value)}
                />
              </div>
            </Row>
            <div className="uiRow">
              {missingPosterCount > 0 ? (
                <span className="uiBadge uiBadgeWarn">
                  {t('export.missingPoster', { count: missingPosterCount })}
                </span>
              ) : null}
              {missingFieldsCount > 0 ? (
                <span className="uiBadge uiBadgeWarn">
                  {t('export.missingFields', { count: missingFieldsCount })}
                </span>
              ) : null}
            </div>
            <Row gap={10}>
              <Button
                onClick={exportSingle}
                disabled={
                  !ready || busy || !rows.length || exportFormat !== 'png'
                }
              >
                {t('export.exportSingle')}
              </Button>
              <Button
                variant="outline"
                onClick={exportBatch}
                disabled={
                  !ready || busy || !rows.length || exportFormat !== 'png'
                }
              >
                {t('export.exportBatch')}
              </Button>
              <Button
                variant="outline"
                onClick={exportToGame}
                disabled={busy || !rows.length}
              >
                {t('ui.exportToGame')}
              </Button>
              <Button
                variant="outline"
                onClick={exportZip}
                disabled={busy || !rows.length}
              >
                {t('export.exportZip')}
              </Button>
              {running ? (
                <Button variant="danger" onClick={cancelExport}>
                  {t('export.cancel')}
                </Button>
              ) : null}
            </Row>
            {zipNotice ? <div className="uiHelp">{zipNotice}</div> : null}
            {progress ? (
              <div>
                <div className="uiHelp">
                  {t('export.exporting', {
                    current: progress.current,
                    total: progress.total,
                    file: progress.fileName,
                  })}
                </div>
                <div className="progress-bar">
                  <div
                    style={{
                      width: `${Math.round((progress.current / progress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="empty">{t('export.idle')}</div>
            )}
            {report ? (
              <div className="list">
                <div className="uiHelp">{t('export.reportTitle')}</div>
                <div className="uiHelp">
                  {t('export.reportSummary', {
                    total: report.total,
                    missing: report.missingImages.length,
                    failures: report.failures.length,
                  })}
                </div>
                {report.missingImages.length ? (
                  <div className="empty">
                    <div className="uiHelp">{t('export.reportMissing')}</div>
                    {report.missingImages.map((item, idx) => (
                      <div key={`${item.rowId}-${idx}`} className="uiHelp">
                        {t('export.reportMissingItem', {
                          id: item.rowId,
                          expected: item.expected,
                        })}
                      </div>
                    ))}
                  </div>
                ) : null}
                {report.failures.length ? (
                  <div className="empty">
                    <div className="uiHelp">{t('export.reportFailures')}</div>
                    {report.failures.map((item, idx) => (
                      <div key={`${item.rowId}-${idx}`} className="uiHelp">
                        {t('export.reportFailureItem', {
                          id: item.rowId,
                          error: item.error,
                        })}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="uiDivider" />
            <div className="uiHelp">{t('ui.tip.videoPoster')}</div>
          </div>
        </Panel>

        <Panel
          title={t('export.previewTitle')}
          subtitle={t('export.previewSubtitle')}
        >
          <div className="empty">
            {t('export.previewHint')} <code>{'{{name}}_{{id}}'}</code>.
          </div>
        </Panel>
      </div>

      {blueprint ? (
        <ExportCanvas
          ref={exportRef}
          blueprint={blueprint}
          projectRoot={projectRoot}
        />
      ) : null}
    </div>
  );
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

function hasRequiredFields(data?: Record<string, any>) {
  if (!data) return false;
  return hasLocalizedValue(data.name) && hasLocalizedValue(data.desc);
}

function hasLocalizedValue(value: any) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') {
    const record = value as Record<string, any>;
    return Boolean(
      String(record.en ?? '').trim() || String(record.ar ?? '').trim(),
    );
  }
  return Boolean(value);
}
