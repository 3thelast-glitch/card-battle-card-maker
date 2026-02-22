// src/store/cardEditorStore.ts
// Zustand store for the live card being designed in DesignEditor.
// Mirrors the fields exposed by CardFrameData but typed for editing.
import { create } from 'zustand';
import type { CardFrameData, Rarity, Element } from '../ui/layout/components/ui/CardFrame';

export type CardEditorState = Required<Pick<CardFrameData,
    'title' | 'description' | 'element' | 'rarity' | 'attack' | 'hp' | 'cost'
>> & {
    traits: string[];
    imageUrl: string | undefined;
    isDirty: boolean;
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
    patchCard: (patch: Partial<CardEditorState>) => void;
    resetCard: () => void;
    markClean: () => void;
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
    isDirty: false,
};

export const useCardEditorStore = create<CardEditorState & CardEditorActions>((set) => ({
    ...DEFAULT_STATE,

    setTitle: (title) => set({ title, isDirty: true }),
    setDescription: (description) => set({ description, isDirty: true }),
    setElement: (element) => set({ element, isDirty: true }),
    setRarity: (rarity) => set({ rarity, isDirty: true }),
    setAttack: (attack) => set({ attack, isDirty: true }),
    setHp: (hp) => set({ hp, isDirty: true }),
    setCost: (cost) => set({ cost, isDirty: true }),
    setImageUrl: (imageUrl) => set({ imageUrl, isDirty: true }),

    setTraits: (traits) => set({ traits, isDirty: true }),

    toggleTrait: (trait) => set((state) => ({
        traits: state.traits.includes(trait)
            ? state.traits.filter((t) => t !== trait)
            : [...state.traits, trait],
        isDirty: true,
    })),

    patchCard: (patch) => set((state) => ({ ...state, ...patch, isDirty: true })),

    resetCard: () => set({ ...DEFAULT_STATE }),

    markClean: () => set({ isDirty: false }),
}));
