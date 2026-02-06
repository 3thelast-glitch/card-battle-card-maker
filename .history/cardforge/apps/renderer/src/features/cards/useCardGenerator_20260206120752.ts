import { useState, useCallback } from 'react';
// Adjust this import path to match where you placed your AI function
import { generateCardFromAI } from '../lib/ai/cardGenerator';

interface UseCardGeneratorReturn {
  generate: (prompt: string, onSuccess: (data: any) => void) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useCardGenerator(): UseCardGeneratorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, onSuccess: (data: any) => void) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the AI generation function
      const data = await generateCardFromAI(prompt);
      
      // Update the store via the callback provided
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate card content.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
}