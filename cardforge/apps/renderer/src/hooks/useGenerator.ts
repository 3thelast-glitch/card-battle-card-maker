// src/hooks/useGenerator.ts
// Hook that wraps the real Gemini API generation service with
// loading/error state managed via generatorStore.
import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useGeneratorStore } from '../store/generatorStore';
import { generateGeminiText } from '../services/gemini.service';
import type { GeneratedCard } from '../store/generatorStore';
import type { Rarity, Element } from '../ui/layout/components/ui/CardFrame';

// ── Maps for random selection ───────────────────────────────
const ELEMENTS: Element[] = ['fire', 'water', 'nature', 'dark', 'light', 'neutral'];
const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const RARITY_WEIGHTS = [35, 30, 20, 12, 3]; // weighted probability

function weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((s, w) => s + w, 0);
    let rng = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
        rng -= weights[i];
        if (rng <= 0) return items[i];
    }
    return items[items.length - 1];
}

function randomElement(): Element {
    return ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
}

function randomRarity(): Rarity {
    return weightedRandom(RARITIES, RARITY_WEIGHTS);
}

// ── Prompt builder ─────────────────────────────────────────
function buildBatchPrompt(theme: string, count: number, lang: 'ar' | 'en'): string {
    return `You are a creative trading card game designer assistant.
Return ONLY valid JSON array. No markdown, no code fences, no explanations.

Task: Generate ${count} unique trading card entries based on the theme: "${theme}".

Required JSON format (array of ${count} objects):
[
  {
    "title": "Card Name in ${lang === 'ar' ? 'Arabic' : 'English'}",
    "description": "Short cinematic description (max 20 words)",
    "element": "fire|water|nature|dark|light|neutral",
    "attack": 10-100,
    "hp": 10-100,
    "cost": 1-10,
    "traits": ["trait1", "trait2"]
  }
]

Language: ${lang === 'ar' ? 'Arabic (Saudi/Gulf dialect preferred)' : 'English'}.
Make each card unique. Vary elements and stats.`;
}

// ── Hook ───────────────────────────────────────────────────
export function useGenerator() {
    const store = useGeneratorStore();

    const generate = useCallback(async (
        prompt: string,
        options?: {
            count?: number;
            rarityFilter?: Rarity | 'random';
            elementFilter?: Element | 'random';
            lang?: 'ar' | 'en';
        },
    ) => {
        if (!prompt.trim()) return;

        const count = options?.count ?? store.config.count;
        const rarFilter = options?.rarityFilter ?? store.config.rarityFilter;
        const elFilter = options?.elementFilter ?? store.config.elementFilter;
        const lang = options?.lang ?? 'ar';

        store.setStatus('generating');
        store.setErrorMessage(null);
        store.clearResults();

        try {
            const batchPrompt = buildBatchPrompt(prompt, count, lang);
            const rawText = await generateGeminiText(batchPrompt);

            // Extract JSON array from response
            const start = rawText.indexOf('[');
            const end = rawText.lastIndexOf(']');
            if (start === -1 || end === -1) throw new Error('لم يُنتج الذكاء الاصطناعي نتيجة صالحة');

            const parsed = JSON.parse(rawText.slice(start, end + 1)) as any[];

            const cards: GeneratedCard[] = parsed.slice(0, count).map((item) => ({
                id: nanoid(),
                generatedAt: Date.now(),
                title: item.title ?? 'بطاقة مجهولة',
                description: item.description ?? '',
                element: (elFilter !== 'random' ? elFilter : (item.element ?? randomElement())) as Element,
                rarity: (rarFilter !== 'random' ? rarFilter : randomRarity()) as Rarity,
                attack: typeof item.attack === 'number' ? item.attack : 50,
                hp: typeof item.hp === 'number' ? item.hp : 50,
                cost: typeof item.cost === 'number' ? item.cost : 4,
                traits: Array.isArray(item.traits) ? item.traits.slice(0, 4) : [],
            }));

            store.setResults(cards);
            store.setStatus('done');

            store.appendToHistory({
                id: nanoid(),
                prompt,
                cards,
                status: 'done',
                timestamp: Date.now(),
            });
        } catch (err: any) {
            const msg = err?.message === 'MISSING_API_KEY'
                ? 'مفتاح Gemini API غير مُعيَّن. أضف VITE_GEMINI_API_KEY في ملف .env'
                : (err?.message ?? 'فشل التوليد - حاول مرة أخرى');

            store.setStatus('error');
            store.setErrorMessage(msg);

            store.appendToHistory({
                id: nanoid(),
                prompt,
                cards: [],
                status: 'error',
                timestamp: Date.now(),
                errorMessage: msg,
            });
        }
    }, [store]);

    const reset = useCallback(() => {
        store.setStatus('idle');
        store.setErrorMessage(null);
        store.clearResults();
        store.setPrompt('');
    }, [store]);

    return {
        // State
        prompt: store.prompt,
        status: store.status,
        isGenerating: store.status === 'generating',
        results: store.results,
        history: store.history,
        errorMessage: store.errorMessage,
        config: store.config,

        // Actions
        setPrompt: store.setPrompt,
        updateConfig: store.updateConfig,
        clearHistory: store.clearHistory,
        generate,
        reset,
    };
}
