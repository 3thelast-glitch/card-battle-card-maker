import React, { useState } from 'react';
import type { ImageAsset, Project } from '@cardsmith/core';
import { createId, sanitizeFileName } from '@cardsmith/core';
import { getParentPath, joinPath } from '@cardsmith/storage';
import { Button, Panel, Row } from '../../components/ui';
import { resolveImageSrc } from '../../utils/file';
import { useTranslation } from 'react-i18next';

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];

export function AssetsScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { t } = useTranslation();
  const { project, onChange } = props;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const assets = project.assets?.images ?? [];
  const projectRoot = project.meta.filePath ? getParentPath(project.meta.filePath) : '';

  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? null;

  const importImages = async () => {
    if (!window.cardsmith) return;
    let filePath = project.meta.filePath;
    let nextProject = project;

    if (!filePath) {
      const res = await window.cardsmith.saveFile();
      if (res.canceled || !res.filePath) return;
      filePath = res.filePath;
      nextProject = { ...project, meta: { ...project.meta, filePath } };
    }

    const dialog = await window.cardsmith.openImageFiles();
    if (dialog.canceled || !dialog.filePaths?.length) return;

    const existingNames = new Set(nextProject.assets?.images?.map((asset) => asset.name.toLowerCase()) ?? []);
    const nextImages: ImageAsset[] = [...(nextProject.assets?.images ?? [])];
    const root = getParentPath(filePath);
    const now = new Date().toISOString();
    const errors: string[] = [];

    for (const sourcePath of dialog.filePaths) {
      const fileName = getFileName(sourcePath);
      const ext = getExtension(fileName);
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        errors.push(t('assets.errors.unsupported', { name: fileName }));
        continue;
      }
      const safeName = getUniqueName(
        `${sanitizeFileName(fileName.slice(0, fileName.length - ext.length))}${ext}`,
        existingNames,
      );
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

  const removeSelected = () => {
    if (!selectedAsset) return;
    const nextImages = assets.filter((asset) => asset.id !== selectedAsset.id);
    onChange({ ...project, assets: { images: nextImages } });
    setSelectedId(null);
  };

  return (
    <div className="screen" style={{ padding: 16 }}>
      <Panel title={t('assets.title')} subtitle={t('assets.subtitle')}>
        <div className="list">
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
