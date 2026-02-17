import { GoogleGenerativeAI } from '@google/generative-ai';

type CardContext = {
  lang: 'ar' | 'en';
  traits?: string[];
  derivedTraits?: string[];
  cardType?: string;
  attack?: number;
  defense?: number;
  relations?: Record<string, string>;
};

export type CardContentResult = {
  name: string;
  description: string;
  balance: {
    atk: number;
    def: number;
    note?: string;
  };
};

if (import.meta.env.DEV) {
  console.log('ENV DEBUG - gemini.service.ts:24');
  console.log('ALL ENVS: - gemini.service.ts:25', import.meta.env);
  console.log('GEMINI KEY: - gemini.service.ts:26', import.meta.env.VITE_GEMINI_API_KEY);
}

const GEMINI_MODEL = 'gemini-1.5-flash';
const FALLBACK_MODEL = 'gemini-pro';

const createGeminiModel = (modelName: string = GEMINI_MODEL) => {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('API key is missing after trim');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

export const generateGeminiText = async (prompt: string): Promise<string> => {
  try {
    const model = createGeminiModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    // ✅ إذا فشل gemini-1.5-flash، استخدم gemini-pro
    if (error?.status === 404 || error?.message?.includes('not found')) {
      console.warn('⚠️ gemini1.5flash failed, falling back to geminipro... - gemini.service.ts:49');
      const fallbackModel = createGeminiModel(FALLBACK_MODEL);
      const result = await fallbackModel.generateContent(prompt);
      return result.response.text();
    }
    console.error('Gemini API Error details: - gemini.service.ts:54', error);
    throw error;
  }
};

const buildPrompt = (context: CardContext) => {
  const payload = {
    lang: context.lang,
    traits: context.traits ?? [],
    derivedTraits: context.derivedTraits ?? [],
    cardType: context.cardType ?? '',
    attack: context.attack ?? 0,
    defense: context.defense ?? 0,
    relations: context.relations ?? {},
  };

  return [
    'You are a card design assistant.',
    'Return ONLY valid JSON. No extra text or code fences.',
    'Output format:',
    '{',
    '  "name": "card name",',
    '  "description": "short cinematic description",',
    '  "balance": { "atk": 0, "def": 0, "note": "reason" }',
    '}',
    `Language: ${payload.lang}.`,
    `Card context: ${JSON.stringify(payload)}`,
  ].join('\n');
};

const extractJson = (text: string) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('INVALID_JSON');
  }
  const jsonText = text.slice(start, end + 1);
  return JSON.parse(jsonText) as CardContentResult;
};

export const generateCardContent = async (context: CardContext): Promise<CardContentResult> => {
  const prompt = buildPrompt(context);
  let data: CardContentResult;
  
  try {
    const model = createGeminiModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    data = extractJson(text);
  } catch (error: any) {
    // ✅ إذا فشل gemini-1.5-flash، استخدم gemini-pro
    if (error?.status === 404 || error?.message?.includes('not found')) {
      console.warn('⚠️ gemini1.5flash failed, falling back to geminipro... - gemini.service.ts:106');
      const fallbackModel = createGeminiModel(FALLBACK_MODEL);
      const result = await fallbackModel.generateContent(prompt);
      const text = result.response.text();
      data = extractJson(text);
    } else {
      console.error('Gemini API Error details: - gemini.service.ts:112', error);
      throw error;
    }
  }

  return {
    name: data.name ?? '',
    description: data.description ?? '',
    balance: {
      atk: Number.isFinite(data.balance?.atk) ? data.balance.atk : context.attack ?? 0,
      def: Number.isFinite(data.balance?.def) ? data.balance.def : context.defense ?? 0,
      note: data.balance?.note ?? '',
    },
  };
};
