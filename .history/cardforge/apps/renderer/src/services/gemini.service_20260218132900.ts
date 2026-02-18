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

// ✅ تحسين: تنظيف المفتاح من المسافات الزائدة (حل مشكلة ويندوز)
const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

if (!apiKey && import.meta.env.DEV) {
  console.warn('⚠️ VITE_GEMINI_API_KEY is not set or empty - gemini.service.ts:27');
}

// ✅ الدالة الأساسية للاتصال (تستخدم v1beta للموديلات الحديثة)
const callGeminiAPI = async (modelName: string, prompt: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  // ✅ التحديث الجوهري: استخدام v1beta بدلاً من v1
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  console.log(`📡 Sending request to: ${modelName} (v1beta) - gemini.service.ts:39`);

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
        temperature: 0.8, // رفعنا الإبداع قليلاً للوصف
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API Error (${modelName}): - gemini.service.ts:65`, errorText);
    throw new Error(`Gemini API failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response candidates from Gemini');
  }

  return data.candidates[0].content.parts[0].text;
};

// ✅ دالة التوليد مع قائمة الموديلات الحديثة
export const generateGeminiText = async (prompt: string): Promise<string> => {
  // ✅ القائمة الجديدة: نبدأ بالأذكى (Pro) ثم الأسرع (Flash)
  // ملاحظة: لا نكتب "models/" هنا لأننا نضيفها في الرابط
  const modelsToTry = [
    'gemini-1.5-pro',        // الخيار الأول: الأذكى والأقوى
    'gemini-1.5-flash',      // الخيار الثاني: السريع والفعال
    'gemini-1.0-pro'         // الخيار الاحتياطي
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`🔄 Trying model: ${model}... - gemini.service.ts:90`);
      return await callGeminiAPI(model, prompt);
    } catch (error: any) {
      console.warn(`❌ Model ${model} failed. Trying next... - gemini.service.ts:93`, error.message);
      // استمر للموديل التالي في القائمة
    }
  }

  throw new Error('All Gemini models failed. Please check your API key and quota.');
};

// بناء النص (Prompt) - لم يتغير
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

  return `
    You are a creative card game design assistant.
    Return ONLY valid JSON. No markdown formatting, no code fences.
    
    Task: Generate a creative name, cinematic description, and balanced stats for a game card.
    
    Input Context:
    ${JSON.stringify(payload)}
    
    Required Output JSON Format:
    {
      "name": "Creative Card Name",
      "description": "A short, immersive, cinematic description of the character or spell.",
      "balance": { 
        "atk": 0, 
        "def": 0, 
        "note": "Brief explanation of why these stats fit the traits." 
      }
    }
    
    Language: ${payload.lang === 'ar' ? 'Arabic (Saudi/Gulf flavor preferred)' : 'English'}.
  `;
};

// استخراج JSON - لم يتغير
const extractJson = (text: string) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('INVALID_JSON_STRUCTURE');
    }
    const jsonText = text.slice(start, end + 1);
    return JSON.parse(jsonText) as CardContentResult;
  } catch (e) {
    console.error("Failed to parse JSON from AI: - gemini.service.ts:148", text);
    throw e;
  }
};

// الدالة النهائية المصدرة
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