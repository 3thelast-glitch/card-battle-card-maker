import { create } from 'zustand';
import type { Project } from '@cardsmith/core';
import type { RecentProject } from '@cardsmith/storage';
import type { Card, TemplateDefinition } from '../templates/types';
import { useCardEditorStore } from '../store/cardEditorStore';

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
  geminiApiKey: string;
  collection: (Card & { id: string })[];
  imageScale: number;
  imageOpacity: number;
  imageBrightness: number;
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
  setGeminiApiKey: (key: string) => void;
  setImageScale: (value: number) => void;
  setImageOpacity: (value: number) => void;
  setImageBrightness: (value: number) => void;
  resetImageSettings: () => void;
  addCards: (cards: (Card & { id: string })[]) => void;
  removeCard: (id: string) => void;
  removeMultipleCards: (ids: string[]) => void;
  saveCard: (card: Card) => void;
  loadCard: (id: string) => Card | undefined;
};

const createCardId = () =>
  `card_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  screen: 'home',
  project: null,
  templates: [],
  recents: [],
  collection: [
    { id: 'c1', title: 'تنين النار', element: 'fire', rarity: 'Legendary', attack: 95, hp: 70, cost: 9, traits: ['طائر', 'أسطوري'], description: 'أسيد الجحيم' },
    { id: 'c2', title: 'ملاك النور', element: 'light', rarity: 'Epic', attack: 80, hp: 85, cost: 8, traits: ['ملاك', 'مقدس'], description: 'حامي السماء' },
    { id: 'c3', title: 'محارب الظلام', element: 'dark', rarity: 'Rare', attack: 65, hp: 75, cost: 6, traits: ['محارب', 'شيطان'], description: 'الخاتل الصامت' },
    { id: 'c4', title: 'روح الغابة', element: 'nature', rarity: 'Uncommon', attack: 45, hp: 100, cost: 4, traits: ['روح', 'حكيم'], description: 'حارس الغابات' },
    { id: 'c5', title: 'تنين الجليد', element: 'water', rarity: 'Epic', attack: 70, hp: 60, cost: 7, traits: ['طائر', 'ثلج'], description: 'سيد الشتاء' },
    { id: 'c6', title: 'عفريت النار', element: 'fire', rarity: 'Rare', attack: 80, hp: 45, cost: 6, traits: ['جني', 'محارب'], description: 'المحرق الأزلي' },
    { id: 'c7', title: 'حارس الحجر', element: 'neutral', rarity: 'Common', attack: 30, hp: 110, cost: 3, traits: ['قديم', 'صلب'], description: 'لا يتزعزع' },
    { id: 'c8', title: 'ساحر السحب', element: 'water', rarity: 'Rare', attack: 55, hp: 65, cost: 5, traits: ['ساحر', 'حكيم'], description: 'سيد المطر' },
    { id: 'c9', title: 'فارس الظلام', element: 'dark', rarity: 'Uncommon', attack: 60, hp: 70, cost: 5, traits: ['فارس', 'شيطان'], description: 'من أعماق التاريخ' },
    { id: 'c10', title: 'راعية الأرض', element: 'nature', rarity: 'Common', attack: 35, hp: 90, cost: 3, traits: ['شافية', 'طبيعة'], description: 'بركة الأراضي' },
    { id: 'c11', title: 'رياح الصحراء', element: 'neutral', rarity: 'Uncommon', attack: 50, hp: 55, cost: 4, traits: ['عاصفة', 'رياح'], description: 'سرعة البرق' },
    { id: 'c12', title: 'أفعى الماء', element: 'water', rarity: 'Common', attack: 40, hp: 80, cost: 3, traits: ['زاحف', 'ماء'], description: 'خفية في الأعماق' },
  ],
  imageScale: 1,
  imageOpacity: 1,
  imageBrightness: 1,
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
  geminiApiKey: localStorage.getItem('geminiApiKey') || '',
  setGeminiApiKey: (key) => {
    localStorage.setItem('geminiApiKey', key);
    set({ geminiApiKey: key });
  },
  setImageScale: (value) => set({ imageScale: value }),
  setImageOpacity: (value) => set({ imageOpacity: value }),
  setImageBrightness: (value) => set({ imageBrightness: value }),
  resetImageSettings: () =>
    set({ imageScale: 1, imageOpacity: 1, imageBrightness: 1 }),
  addCards: (cards) => set((state) => ({ collection: [...state.collection, ...cards] })),
  removeCard: (id) =>
    set((state) => ({
      collection: state.collection.filter((card) => card.id !== id),
    })),
  removeMultipleCards: (ids) =>
    set((state) => ({
      collection: state.collection.filter((card) => !ids.includes(card.id)),
    })),
  saveCard: (card) => set((state) => {
    const editorImageSettings = useCardEditorStore.getState();
    return {
      collection: [
        ...state.collection,
        {
          ...card,
          imageUrl: card.imageUrl ?? card.artUrl,
          artUrl: card.artUrl ?? card.imageUrl,
          imageScale:
            card.imageScale ?? editorImageSettings.imageScale ?? state.imageScale ?? 1,
          imageOpacity:
            card.imageOpacity ??
            editorImageSettings.imageOpacity ??
            state.imageOpacity ??
            1,
          imageBrightness:
            card.imageBrightness ??
            editorImageSettings.imageBrightness ??
            state.imageBrightness ??
            1,
          id: createCardId(),
        },
      ],
    };
  }),
  loadCard: (id) => {
    const state = get();
    const card = state.collection.find((c) => c.id === id);
    if (!card) return undefined;

    useCardEditorStore.getState().patchCard({
      title: card.title,
      description: card.description,
      element: (card.element ?? 'neutral') as any,
      rarity: (card.rarity ?? 'Common') as any,
      attack: card.attack ?? 0,
      hp: card.hp ?? 0,
      cost: card.cost ?? 0,
      traits: card.traits ?? [],
      imageUrl: card.imageUrl ?? card.artUrl,
      imageScale: card.imageScale ?? 1,
      imageOpacity: card.imageOpacity ?? 1,
      imageBrightness: card.imageBrightness ?? 1,
    });
    useCardEditorStore.getState().markClean();
    set({
      imageScale: card.imageScale ?? 1,
      imageOpacity: card.imageOpacity ?? 1,
      imageBrightness: card.imageBrightness ?? 1,
    });

    return card;
  },
}));
