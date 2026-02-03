import { create } from 'zustand';
import type { Blueprint, Project } from '@cardsmith/core';
import type { RecentProject } from '@cardsmith/storage';

export type Screen = 'home' | 'dashboard' | 'editor' | 'data' | 'export';

type AppState = {
  screen: Screen;
  project: Project | null;
  templates: Blueprint[];
  recents: RecentProject[];
  activeBlueprintId?: string;
  activeSetId?: string;
  activeTableId?: string;
  previewRowId?: string;
};

type AppActions = {
  setScreen: (screen: Screen) => void;
  setProject: (project: Project | null) => void;
  updateProject: (updater: (project: Project) => Project) => void;
  setTemplates: (templates: Blueprint[]) => void;
  setRecents: (recents: RecentProject[]) => void;
  setActiveBlueprintId: (id?: string) => void;
  setActiveSetId: (id?: string) => void;
  setActiveTableId: (id?: string) => void;
  setPreviewRowId: (id?: string) => void;
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  screen: 'home',
  project: null,
  templates: [],
  recents: [],
  setScreen: (screen) => set({ screen }),
  setProject: (project) => set({ project }),
  updateProject: (updater) => {
    const project = get().project;
    if (!project) return;
    set({ project: updater(project) });
  },
  setTemplates: (templates) => set({ templates }),
  setRecents: (recents) => set({ recents }),
  setActiveBlueprintId: (id) => set({ activeBlueprintId: id }),
  setActiveSetId: (id) => set({ activeSetId: id }),
  setActiveTableId: (id) => set({ activeTableId: id }),
  setPreviewRowId: (id) => set({ previewRowId: id }),
}));
