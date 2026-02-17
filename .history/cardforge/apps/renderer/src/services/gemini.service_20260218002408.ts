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

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey && import.meta.env.DEV) {
  console.warn('⚠️ VITE_GEMINI_API_KEY is not set - gemini.service.ts:26');
}

// ✅ استخدم v1 مع الاسم الكامل للموديل
const callGeminiAPI = async (modelFullName: string, prompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  // ✅ استخدم v1 مع اسم الموديل الكامل
  const url = `https://generativelanguage.googleapis.com/v1/${modelFullName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error: - gemini.service.ts:62', errorText);
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  return data.candidates[0].content.parts[0].text;
};

export const generateGeminiText = async (prompt: string): Promise<string> => {
  // ✅ جرّب الموديلات المختلفة
  const modelsToTry = [
    'models/gemini-1.5-flash-latest',
    'models/gemini-1.5-flash',
    'models/gemini-1.0-pro-latest',
    'models/gemini-1.0-pro',
    'models/gemini-pro'
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`🔄 Trying model: ${model} - gemini.service.ts:87`);
      return await callGeminiAPI(model, prompt);
    } catch (error: any) {
      console.warn(`❌ ${model} failed: - gemini.service.ts:90`, error.message);
      // استمر للموديل التالي
    }
  }

  throw new Error('All Gemini models failed. Please check your API key.');
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
  const text = await generateGeminiText(prompt);
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
