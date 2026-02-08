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

const getApiKey = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return typeof key === 'string' && key.trim().length ? key.trim() : '';
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
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = buildPrompt(context);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const data = extractJson(text);

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
