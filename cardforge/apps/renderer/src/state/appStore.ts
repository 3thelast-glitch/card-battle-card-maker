import { create } from 'zustand';
import type { Project } from '@cardsmith/core';
import type { RecentProject } from '@cardsmith/storage';
import type { TemplateDefinition } from '../templates/types';

export type Screen =
  | 'home'
  | 'dashboard'
  | 'editor'
  | 'data'
  | 'assets'
  | 'export'
  | 'simulator'
  | 'templates'
  | 'settings';

type AppState = {
  screen: Screen;
  project: Project | null;
  templates: TemplateDefinition[];
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
  setTemplates: (templates: TemplateDefinition[]) => void;
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
