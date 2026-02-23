// src/store/generatorStore.ts
// Zustand store for the AI card generation workflow.
import { create } from 'zustand';
import type {
  CardFrameData,
  Rarity,
  Element,
} from '../ui/layout/components/ui/CardFrame';

export type GenerationStatus = 'idle' | 'generating' | 'done' | 'error';

export type GeneratedCard = CardFrameData & {
  id: string;
  generatedAt: number;
};

export type HistoryEntry = {
  id: string;
  prompt: string;
  cards: GeneratedCard[];
  status: 'done' | 'error';
  timestamp: number;
  errorMessage?: string;
};

type GeneratorConfig = {
  count: number;
  elementFilter: Element | 'random';
  rarityFilter: Rarity | 'random';
};

type GeneratorState = {
  prompt: string;
  status: GenerationStatus;
  errorMessage: string | null;
  results: GeneratedCard[];
  history: HistoryEntry[];
  config: GeneratorConfig;
};

type GeneratorActions = {
  setPrompt: (prompt: string) => void;
  setStatus: (status: GenerationStatus) => void;
  setErrorMessage: (msg: string | null) => void;
  setResults: (cards: GeneratedCard[]) => void;
  appendToHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  clearResults: () => void;
  updateConfig: (patch: Partial<GeneratorConfig>) => void;
};

const DEFAULT_CONFIG: GeneratorConfig = {
  count: 4,
  elementFilter: 'random',
  rarityFilter: 'random',
};

export const useGeneratorStore = create<GeneratorState & GeneratorActions>(
  (set) => ({
    prompt: '',
    status: 'idle',
    errorMessage: null,
    results: [],
    history: [],
    config: DEFAULT_CONFIG,

    setPrompt: (prompt) => set({ prompt }),
    setStatus: (status) => set({ status }),
    setErrorMessage: (errorMessage) => set({ errorMessage }),
    setResults: (results) => set({ results }),
    clearResults: () => set({ results: [] }),
    clearHistory: () => set({ history: [] }),

    appendToHistory: (entry) =>
      set((state) => ({
        history: [entry, ...state.history].slice(0, 50), // keep last 50
      })),

    updateConfig: (patch) =>
      set((state) => ({
        config: { ...state.config, ...patch },
      })),
  }),
);
