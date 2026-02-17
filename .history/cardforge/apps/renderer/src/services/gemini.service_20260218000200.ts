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

// ✅ استخدم v1 API مباشرة (ليس v1beta)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models';

const callGeminiAPI = async (model: string, prompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

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
    console.error('Gemini API Error: - gemini.service.ts:63', errorText);
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  return data.candidates[0].content.parts[0].text;
};

export const generateGeminiText = async (prompt: string): Promise<string> => {
  try {
    // ✅ جرّب gemini-1.5-flash أولاً
    return await callGeminiAPI('gemini-1.5-flash', prompt);
  } catch (error: any) {
    // ✅ إذا فشل، استخدم gemini-pro
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      console.warn('⚠️ gemini1.5flash failed, trying geminipro... - gemini.service.ts:83');
      return await callGeminiAPI('gemini-pro', prompt);
    }
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
  let text: string;
  
  try {
    // ✅ جرّب gemini-1.5-flash أولاً
    text = await callGeminiAPI('gemini-1.5-flash', prompt);
  } catch (error: any) {
    // ✅ إذا فشل، استخدم gemini-pro
    if (error?.message?.includes('404') || error?.message?.includes('not found')) {
      console.warn('⚠️ gemini1.5flash failed, trying geminipro... - gemini.service.ts:135');
      text = await callGeminiAPI('gemini-pro', prompt);
    } else {
      throw error;
    }
  }

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
