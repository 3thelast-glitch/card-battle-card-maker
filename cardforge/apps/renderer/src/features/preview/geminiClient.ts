import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(API_KEY);

export async function fetchAIData(prompt: string) {
  if (!API_KEY) {
    throw new Error('Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const generationPrompt = `Generate a trading card based on the theme: "${prompt}".
Return a JSON object with the following keys:
- name: string
- main_element: string (e.g. Fire, Water, Nature, Dark)
- traits: string[] (e.g. ["Sword", "Shield"])
- attack: number
- hp: number`;

  const result = await model.generateContent(generationPrompt);
  const response = result.response;
  const text = response.text();

  return JSON.parse(text);
}