// src/store/cardEditorStore.ts
// Zustand store for the live card being designed in DesignEditor.
// Mirrors the fields exposed by CardFrameData but typed for editing.
import { create } from 'zustand';
import type {
  CardFrameData,
  Rarity,
  Element,
} from '../ui/layout/components/ui/CardFrame';

export type LayerType = 'art' | 'text' | 'element' | 'stats' | 'image';
export type EditorLayer = {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
};
export type BadgeKey = 'element' | 'rarity' | 'attack' | 'hp' | 'title' | 'desc';
export type BadgePos = { x: number; y: number };

export type CardEditorState = Required<
  Pick<
    CardFrameData,
    'title' | 'description' | 'element' | 'rarity' | 'attack' | 'hp' | 'cost'
  >
> & {
  traits: string[];
  imageUrl: string | undefined;
  imageScale: number;
  imageOpacity: number;
  imageBrightness: number;
  isDirty: boolean;
  layers: EditorLayer[];
  activeLayerId: string | null;
  isTransformMode: boolean;
  badgePositions: Record<BadgeKey, BadgePos>;
  showDescription: boolean;
  artZoneHeight: number;
  isTemplateGalleryOpen: boolean;
  activeTemplateId: string;
  zoomLevel: number;
};

type CardEditorActions = {
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setElement: (element: Element) => void;
  setRarity: (rarity: Rarity) => void;
  setAttack: (attack: number) => void;
  setHp: (hp: number) => void;
  setCost: (cost: number) => void;
  setTraits: (traits: string[]) => void;
  toggleTrait: (trait: string) => void;
  setImageUrl: (url: string | undefined) => void;
  setImageScale: (scale: number) => void;
  setImageOpacity: (opacity: number) => void;
  setImageBrightness: (brightness: number) => void;
  resetImageSettings: () => void;
  patchCard: (patch: Partial<CardEditorState>) => void;
  resetCard: () => void;
  markClean: () => void;
  // Layer actions
  setLayers: (layers: EditorLayer[]) => void;
  addLayer: (layer: Omit<EditorLayer, 'id'>) => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  setActiveLayerId: (id: string | null) => void;
  setTransformMode: (isTransformMode: boolean) => void;
  clearArtImage: () => void;
  bringLayerForward: (id: string) => void;
  sendLayerBackward: (id: string) => void;
  updateBadgePosition: (badge: BadgeKey, pos: BadgePos) => void;
  toggleDescription: () => void;
  setArtZoneHeight: (height: number) => void;
  toggleTemplateGallery: () => void;
  closeTemplateGallery: () => void;
  applyTemplate: (id: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};

const DEFAULT_STATE: CardEditorState = {
  title: 'بطاقة جديدة',
  description: 'أدخل وصف البطاقة هنا...',
  element: 'neutral',
  rarity: 'Common',
  attack: 50,
  hp: 50,
  cost: 4,
  traits: [],
  imageUrl: undefined,
  imageScale: 1,
  imageOpacity: 1,
  imageBrightness: 1,
  isDirty: false,
  layers: [
    { id: 'l1', name: 'الفن الرئيسي', type: 'art', visible: true },
    { id: 'l2', name: 'العنوان', type: 'text', visible: true },
    { id: 'l3', name: 'العنصر', type: 'element', visible: true },
    { id: 'l4', name: 'الإحصائيات', type: 'stats', visible: true },
  ],
  activeLayerId: null,
  isTransformMode: false,
  badgePositions: {
    element: { x: 0, y: 0 },
    rarity: { x: 0, y: 0 },
    attack: { x: 0, y: 0 },
    hp: { x: 0, y: 0 },
    title: { x: 0, y: 0 },
    desc: { x: 0, y: 0 },
  },
  showDescription: true,
  artZoneHeight: 240,
  isTemplateGalleryOpen: false,
  activeTemplateId: 'classic',
  zoomLevel: 1,
};

export const useCardEditorStore = create<CardEditorState & CardEditorActions>(
  (set) => ({
    ...DEFAULT_STATE,

    setTitle: (title) => set({ title, isDirty: true }),
    setDescription: (description) => set({ description, isDirty: true }),
    setElement: (element) => set({ element, isDirty: true }),
    setRarity: (rarity) => set({ rarity, isDirty: true }),
    setAttack: (attack) => set({ attack, isDirty: true }),
    setHp: (hp) => set({ hp, isDirty: true }),
    setCost: (cost) => set({ cost, isDirty: true }),
    setImageUrl: (imageUrl) => set({ imageUrl, isDirty: true }),
    setImageScale: (imageScale) => set({ imageScale, isDirty: true }),
    setImageOpacity: (imageOpacity) => set({ imageOpacity, isDirty: true }),
    setImageBrightness: (imageBrightness) => set({ imageBrightness, isDirty: true }),
    resetImageSettings: () =>
      set({
        imageScale: 1,
        imageOpacity: 1,
        imageBrightness: 1,
        isDirty: true,
      }),

    setTraits: (traits) => set({ traits, isDirty: true }),

    toggleTrait: (trait) =>
      set((state) => ({
        traits: state.traits.includes(trait)
          ? state.traits.filter((t) => t !== trait)
          : [...state.traits, trait],
        isDirty: true,
      })),

    patchCard: (patch) =>
      set((state) => ({ ...state, ...patch, isDirty: true })),

    resetCard: () => set({ ...DEFAULT_STATE }),

    markClean: () => set({ isDirty: false }),

    setLayers: (layers) => set({ layers, isDirty: true }),

    addLayer: (layer) =>
      set((state) => ({
        layers: [...state.layers, { ...layer, id: `layer-${Date.now()}` }],
        activeLayerId: `layer-${Date.now()}`,
        isDirty: true,
      })),

    removeLayer: (id) =>
      set((state) => ({
        layers: state.layers.filter((l) => l.id !== id),
        activeLayerId: state.activeLayerId === id ? null : state.activeLayerId,
        isDirty: true,
      })),

    toggleLayerVisibility: (id) =>
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, visible: !l.visible } : l,
        ),
        isDirty: true,
      })),

    setActiveLayerId: (activeLayerId) => set({ activeLayerId }),

    setTransformMode: (isTransformMode) => set({ isTransformMode }),

    clearArtImage: () =>
      set((state) => ({
        imageUrl: undefined,
        activeLayerId:
          state.activeLayerId === 'main-art-image' ? null : state.activeLayerId,
        isDirty: true,
      })),

    bringLayerForward: (id) =>
      set((state) => {
        const index = state.layers.findIndex((l) => l.id === id);
        if (index <= 0) return state;
        const newLayers = [...state.layers];
        [newLayers[index - 1], newLayers[index]] = [
          newLayers[index],
          newLayers[index - 1],
        ];
        return { layers: newLayers, isDirty: true };
      }),

    sendLayerBackward: (id) =>
      set((state) => {
        const index = state.layers.findIndex((l) => l.id === id);
        if (index === -1 || index >= state.layers.length - 1) return state;
        const newLayers = [...state.layers];
        [newLayers[index], newLayers[index + 1]] = [
          newLayers[index + 1],
          newLayers[index],
        ];
        return { layers: newLayers, isDirty: true };
      }),

    updateBadgePosition: (badge, pos) =>
      set((state) => ({
        badgePositions: { ...state.badgePositions, [badge]: pos },
        isDirty: true,
      })),

    toggleDescription: () =>
      set((state) => ({
        showDescription: !state.showDescription,
        isDirty: true,
      })),

    setArtZoneHeight: (artZoneHeight) => set({ artZoneHeight, isDirty: true }),

    toggleTemplateGallery: () =>
      set((state) => ({ isTemplateGalleryOpen: !state.isTemplateGalleryOpen })),

    closeTemplateGallery: () => set({ isTemplateGalleryOpen: false }),

    applyTemplate: (id) => set({ activeTemplateId: id, isDirty: true }),

    zoomIn: () =>
      set((state) => ({ zoomLevel: Math.min(state.zoomLevel + 0.1, 2.5) })),

    zoomOut: () =>
      set((state) => ({ zoomLevel: Math.max(state.zoomLevel - 0.1, 0.4) })),

    resetZoom: () => set({ zoomLevel: 1 }),
  }),
);
