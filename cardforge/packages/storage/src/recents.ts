import type { Project } from '@cardsmith/core';

export type RecentProject = {
  name: string;
  filePath: string;
  lastOpened: string;
};

export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

const RECENTS_KEY = 'cardsmith.recents';

function getStorage(store?: StorageLike): StorageLike | null {
  if (store) return store;
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
}

export function loadRecentProjects(store?: StorageLike): RecentProject[] {
  try {
    const storage = getStorage(store);
    if (!storage) return [];
    const raw = storage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveRecentProjects(recents: RecentProject[], store?: StorageLike) {
  const storage = getStorage(store);
  if (!storage) return;
  storage.setItem(RECENTS_KEY, JSON.stringify(recents));
}

export function addRecentProject(project: Project, filePath: string, store?: StorageLike) {
  const recents = loadRecentProjects(store);
  const next: RecentProject = {
    name: project.meta.name,
    filePath,
    lastOpened: new Date().toISOString(),
  };

  const filtered = recents.filter((r) => r.filePath !== filePath);
  const updated = [next, ...filtered].slice(0, 12);
  saveRecentProjects(updated, store);
  return updated;
}
