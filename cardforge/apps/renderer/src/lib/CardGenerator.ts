import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAppStore } from '../state/appStore';

export interface GeneratedCardData {
  name: string;
  hp: number;
  attack: number;
  description: string;
  imagePrompt: string;
}

export class CardGenerator {
  async generateCard(theme: string): Promise<GeneratedCardData> {
    const storeKey = useAppStore.getState().geminiApiKey?.trim();
    const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    const currentKey = storeKey || envKey;

    if (!currentKey) {
      throw new Error('مفتاح API مفقود أو فارغ');
    }

    const genAI = new GoogleGenerativeAI(currentKey);

    // Using gemini-1.5-flash for speed and efficiency
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Generate a trading card character based on the theme: "${theme}".
Return a JSON object with the following keys:
- name: string
- hp: number (integer between 1-100)
- attack: number (integer between 1-20)
- description: string (short ability text or lore)
- imagePrompt: string (detailed visual description for image generation)

Ensure the response is valid JSON and contains no markdown formatting.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up potential markdown code blocks
      const cleanedText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanedText) as GeneratedCardData;
    } catch (error) {
      console.error('Card generation failed: - CardGenerator.ts:42', error);
      throw new Error('Failed to generate card data');
    }
  }
}
