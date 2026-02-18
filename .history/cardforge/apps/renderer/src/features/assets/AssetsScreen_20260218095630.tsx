import React, { useState } from 'react';
import type { ImageAsset, Project } from '@cardsmith/core';
import { createId, sanitizeFileName } from '@cardsmith/core';
import { getParentPath, joinPath } from '@cardsmith/storage';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, Row } from '../../components/ui';
import { resolveImageSrc } from '../../utils/file';

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const SUPPORTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function AssetsScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { t } = useTranslation();
  const { project, onChange } = props;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const assets = project.assets?.images ?? [];
  const projectRoot = project.meta.filePath ? getParentPath(project.meta.filePath) : '';

  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? null;

  const importImagesFromSources = async (sources: Array<{ path?: string; file?: File }>) => {
    if (!window.cardsmith) return;
    if (!sources.length) return;
    let filePath = project.meta.filePath;
    let nextProject = project;

    if (!filePath) {
      const res = await window.cardsmith.saveFile();
      if (res.canceled || !res.filePath) return;
      filePath = res.filePath;
      nextProject = { ...project, meta: { ...project.meta, filePath } };
    }

    const existingNames = new Set(nextProject.assets?.images?.map((asset) => asset.name.toLowerCase()) ?? []);
    const nextImages: ImageAsset[] = [...(nextProject.assets?.images ?? [])];
    const root = getParentPath(filePath);
    const now = new Date().toISOString();
    const errors: string[] = [];

    for (const source of sources) {
      const sourcePath = source.path ?? ((source.file as File & { path?: string })?.path ?? '');
      const fileName = source.file?.name || getFileName(sourcePath);
      const ext = getExtension(fileName);
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        errors.push(t('assets.errors.unsupported', { name: fileName || t('assets.title') }));
        continue;
      }

      const safeName = getUniqueName(
        `${sanitizeFileName(fileName.slice(0, fileName.length - ext.length))}${ext}`,
        existingNames,
      );

      if (sourcePath) {
        const relativePath = `assets/images/${safeName}`;
        const destinationPath = joinPath(root, relativePath);
        const copyResult = await window.cardsmith.copyFile(sourcePath, destinationPath);
        if (!copyResult.ok) {
          if (copyResult.error === 'EEXIST') {
            const renamed = getUniqueName(
              `${sanitizeFileName(fileName.slice(0, fileName.length - ext.length))}${ext}`,
              existingNames,
            );
            const retryPath = joinPath(root, `assets/images/${renamed}`);
            const retry = await window.cardsmith.copyFile(sourcePath, retryPath);
            if (!retry.ok) {
              errors.push(t('assets.errors.copyFailed', { name: fileName }));
              continue;
            }
            nextImages.push({
              id: createId('asset'),
              name: renamed,
              src: `assets/images/${renamed}`,
              size: retry.size ?? 0,
              addedAt: now,
            });
            continue;
          }
          errors.push(t('assets.errors.copyFailed', { name: fileName }));
          continue;
        }

        nextImages.push({
          id: createId('asset'),
          name: safeName,
          src: relativePath,
          size: copyResult.size ?? 0,
          addedAt: now,
        });
        continue;
      }

      if (source.file) {
        try {
          const dataUrl = await fileToDataUrl(source.file, t('assets.errors.copyFailed', { name: fileName }));
          nextImages.push({
            id: createId('asset'),
            name: safeName,
            src: dataUrl,
            size: source.file.size ?? 0,
            addedAt: now,
          });
        } catch {
          errors.push(t('assets.errors.copyFailed', { name: fileName }));
        }
        continue;
      }

      errors.push(t('assets.errors.copyFailed', { name: fileName }));
    }

    if (errors.length) {
      alert(errors.join('\n'));
    }

    onChange({
      ...nextProject,
      assets: {
        images: nextImages,
      },
    });
  };

  const importImages = async () => {
    if (!window.cardsmith) return;
    const dialog = await window.cardsmith.openImageFiles();
    if (dialog.canceled || !dialog.filePaths?.length) return;
    await importImagesFromSources(dialog.filePaths.map((path) => ({ path })));
  };

  const removeSelected = () => {
    if (!selectedAsset) return;
    const nextImages = assets.filter((asset) => asset.id !== selectedAsset.id);
    onChange({ ...project, assets: { images: nextImages } });
    setSelectedId(null);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const files = Array.from(event.dataTransfer.files ?? []).filter((file) =>
      isSupportedImageFile(file, (file as File & { path?: string })?.path),
    );
    if (!files.length) return;
    await importImagesFromSources(
      files.map((file) => ({
        file,
        path: (file as File & { path?: string })?.path,
      })),
    );
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  return (
    <div className="screen" style={{ padding: 16 }}>
      <Panel title={t('assets.title')} subtitle={t('assets.subtitle')}>
        <div className="list">
          <div
            className={`mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              isDragActive
                ? 'border-emerald-400 bg-emerald-50/80 shadow-inner'
                : 'border-slate-300 bg-white/70 hover:border-slate-400 hover:bg-white'
            }`}
            onClick={importImages}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                importImages();
              }
            }}
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Upload className="h-6 w-6" />
            </span>
            <div className="text-sm font-semibold text-slate-700">
              {isDragActive
                ? t('assets.dragActive', { defaultValue: 'Release to add images' })
                : t('assets.dragHint', { defaultValue: 'Drop images here or click to upload' })}
            </div>
            <div className="text-xs text-slate-500">PNG, JPG, JPEG, WEBP</div>
          </div>
          <Row gap={10}>
            <Button onClick={importImages}>{t('assets.import')}</Button>
            <Button variant="outline" onClick={removeSelected} disabled={!selectedAsset}>
              {t('assets.remove')}
            </Button>
            <div className="hint">{t('assets.dragHint')}</div>
          </Row>

          {assets.length === 0 ? (
            <div className="empty">{t('assets.noAssets')}</div>
          ) : (
            <div className="assets-grid">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className={`asset-card ${selectedId === asset.id ? 'asset-card-active' : ''}`}
                  onClick={() => setSelectedId(asset.id)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/x-cardsmith-asset', JSON.stringify({ src: asset.src, name: asset.name }));
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <div
                    className="asset-thumb"
                    style={{
                      backgroundImage: `url("${resolveImageSrc(asset.src, projectRoot)}")`,
                    }}
                  />
                  <div className="asset-meta">
                    <div className="asset-name">{asset.name}</div>
                    <div className="hint">{formatBytes(asset.size ?? 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function getFileName(filePath: string) {
  if (!filePath) return '';
  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}

function getExtension(fileName: string) {
  const idx = fileName.lastIndexOf('.');
  if (idx <= 0) return '';
  return fileName.slice(idx).toLowerCase();
}

function isSupportedImageFile(file: File, filePath?: string) {
  const fileName = file.name || getFileName(filePath ?? '');
  const ext = getExtension(fileName || filePath || '');
  if (SUPPORTED_EXTENSIONS.includes(ext)) return true;
  if (file.type && SUPPORTED_MIME_TYPES.has(file.type.toLowerCase())) return true;
  return false;
}

function fileToDataUrl(file: File, errorMessage: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(errorMessage));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function getUniqueName(baseName: string, existing: Set<string>) {
  let name = baseName;
  let counter = 1;
  const ext = getExtension(baseName);
  const root = ext ? baseName.slice(0, -ext.length) : baseName;
  while (existing.has(name.toLowerCase())) {
    name = `${root}_${counter}${ext}`;
    counter += 1;
  }
  existing.add(name.toLowerCase());
  return name;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
