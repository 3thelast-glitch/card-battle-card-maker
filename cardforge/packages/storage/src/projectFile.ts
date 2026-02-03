import type { Project } from '@cardsmith/core';
import { getProjectVersion, touchProject } from '@cardsmith/core';

export function stringifyProject(project: Project): string {
  const touched = touchProject(project);
  return JSON.stringify(touched, null, 2);
}

export function parseProject(text: string): Project {
  const parsed = JSON.parse(text) as Project;
  if (!parsed?.meta || !parsed.sets || !parsed.blueprints) {
    throw new Error('Invalid project file');
  }

  const version = parsed.meta.version ?? getProjectVersion();
  const meta = {
    name: parsed.meta.name ?? 'Imported Project',
    createdAt: parsed.meta.createdAt ?? new Date().toISOString(),
    updatedAt: parsed.meta.updatedAt ?? new Date().toISOString(),
    ...parsed.meta,
    version,
  };

  return {
    ...parsed,
    meta,
    sets: parsed.sets ?? [],
    blueprints: parsed.blueprints ?? [],
    items: parsed.items ?? [],
    dataTables: parsed.dataTables ?? [],
  };
}
