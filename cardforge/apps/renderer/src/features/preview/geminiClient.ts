import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateCardData(prompt: string) {
  if (!window.ai?.generate) {
    throw new Error('Gemini API Key is missing. Please set GEMINI_API_KEY in the main process.');
  }

  const generationPrompt = `Generate a trading card based on the theme: "${prompt}".
Return a JSON object with the following keys:
- name: string
- main_element: string (e.g. Fire, Water, Nature, Dark)
- traits: string[] (e.g. ["Sword", "Shield"])
- attack: number
- hp: number`;

  const result = await window.ai.generate({
    prompt: generationPrompt,
    model: 'gemini-1.5-flash',
    temperature: 0.7,
  });

  if (!result?.ok || !result.text) {
    throw new Error(result?.error ?? 'Gemini request failed.');
  }

  const cleaned = result.text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function fetchAIData(prompt: string) {
  return generateCardData(prompt);
}
