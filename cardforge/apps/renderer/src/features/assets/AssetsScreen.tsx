import React, { useEffect, useRef, useState } from 'react';
import type { ImageAsset, Project } from '@cardsmith/core';
import { getParentPath } from '@cardsmith/storage';
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assets = project.assets?.images ?? [];
  const projectRoot = project.meta.filePath ? getParentPath(project.meta.filePath) : '';
  const assetsRef = useRef<ImageAsset[]>(assets);
  const projectRef = useRef<Project>(project);

  const selectedAsset = assets.find((asset) => asset.id === selectedId) ?? null;

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  const processFiles = (incoming?: FileList | File[] | null) => {
    const files = Array.from(incoming ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      if (!isSupportedImageFile(file)) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') return;
        const asset = { id: Date.now(), name: file.name, path: result };
        console.log('File processed:', file.name);
        const nextAsset: ImageAsset = {
          id: String(asset.id),
          name: asset.name,
          src: asset.path,
          size: file.size ?? 0,
          addedAt: new Date().toISOString(),
        };
        const nextImages = [...assetsRef.current, nextAsset];
        assetsRef.current = nextImages;
        const nextProject = { ...projectRef.current, assets: { images: nextImages } };
        projectRef.current = nextProject;
        onChange(nextProject);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = '';
  };

  const removeSelected = () => {
    if (!selectedAsset) return;
    const nextImages = assets.filter((asset) => asset.id !== selectedAsset.id);
    const nextProject = { ...project, assets: { images: nextImages } };
    assetsRef.current = nextImages;
    projectRef.current = nextProject;
    onChange(nextProject);
    setSelectedId(null);
  };

  const displayAssets = assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    path: asset.src.startsWith('data:') ? asset.src : resolveImageSrc(asset.src, projectRoot),
    size: asset.size ?? 0,
  }));

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    processFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="screen" style={{ padding: 16 }}>
      <Panel title={t('assets.title')} subtitle={t('assets.subtitle')}>
        <div className="list">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div
            className={`mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
              isDragging
                ? 'border-emerald-400 bg-emerald-50/80 shadow-inner'
                : 'border-slate-300 bg-white/70 hover:border-slate-400 hover:bg-white'
            }`}
            onClick={handleBrowseClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleBrowseClick();
              }
            }}
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Upload className="h-6 w-6" />
            </span>
            <div className="text-sm font-semibold text-slate-700">
              {isDragging
                ? t('assets.dragActive', { defaultValue: 'Release to add images' })
                : t('assets.dragHint', { defaultValue: 'Drop images here or click to upload' })}
            </div>
            <div className="text-xs text-slate-500">PNG, JPG, JPEG, WEBP</div>
          </div>
          <Row gap={10}>
            <Button onClick={handleBrowseClick}>{t('assets.import')}</Button>
            <Button variant="outline" onClick={removeSelected} disabled={!selectedAsset}>
              {t('assets.remove')}
            </Button>
            <div className="hint">{t('assets.dragHint')}</div>
          </Row>

          {displayAssets.length === 0 ? (
            <div className="mt-8 flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 text-lg font-semibold text-slate-500">
              {t('assets.dragHint', { defaultValue: 'Drop images here' })}
            </div>
          ) : (
            <div className="assets-grid">
              {displayAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={`asset-card ${selectedId === asset.id ? 'asset-card-active' : ''}`}
                  onClick={() => setSelectedId(asset.id)}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      'application/x-cardsmith-asset',
                      JSON.stringify({ src: asset.path, name: asset.name }),
                    );
                    event.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <div
                    className="asset-thumb"
                    style={{
                      backgroundImage: `url("${asset.path}")`,
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

function getExtension(fileName: string) {
  const idx = fileName.lastIndexOf('.');
  if (idx <= 0) return '';
  return fileName.slice(idx).toLowerCase();
}

function isSupportedImageFile(file: File) {
  const ext = getExtension(file.name || '');
  if (SUPPORTED_EXTENSIONS.includes(ext)) return true;
  if (file.type && SUPPORTED_MIME_TYPES.has(file.type.toLowerCase())) return true;
  return false;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
