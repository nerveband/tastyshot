import { useState, useCallback } from 'react';
import { geminiService, GEMINI_MODELS, GEMINI_PROMPTS } from '../services/gemini';
import type { GeminiModel, GeminiProcessResult } from '../services/gemini';

export interface EditingPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

export const useGemini = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [geminiTextResponse, setGeminiTextResponse] = useState<string | null>(null);

  // Available Gemini models
  const availableModels = GEMINI_MODELS;

  // Editing presets
  const editingPresets: EditingPreset[] = [
    {
      id: 'enhance',
      name: 'ENHANCE',
      description: 'AI-powered enhancement',
      prompt: GEMINI_PROMPTS.ENHANCE,
      icon: 'sparkles',
    },
    {
      id: 'dramatic',
      name: 'DRAMATIC',
      description: 'Cinematic lighting',
      prompt: GEMINI_PROMPTS.DRAMATIC,
      icon: 'sun',
    },
    {
      id: 'vintage',
      name: 'VINTAGE',
      description: 'Film-style look',
      prompt: GEMINI_PROMPTS.VINTAGE,
      icon: 'film',
    },
    {
      id: 'bw',
      name: 'B&W',
      description: 'Black and white',
      prompt: GEMINI_PROMPTS.BW,
      icon: 'image',
    },
    {
      id: 'pro',
      name: 'PRO EDIT',
      description: 'Studio lighting',
      prompt: GEMINI_PROMPTS.PRO_EDIT,
      icon: 'aperture',
    },
    {
      id: 'artistic',
      name: 'ARTISTIC',
      description: 'Creative effects',
      prompt: GEMINI_PROMPTS.ARTISTIC,
      icon: 'palette',
    },
  ];

  // Process image with Gemini
  const processImage = useCallback(async (
    model: GeminiModel,
    imageUrl: string,
    prompt: string
  ): Promise<GeminiProcessResult | null> => {
    setIsProcessing(true);
    setProgress(['Initializing Gemini AI...']);
    setError(null);
    setGeminiTextResponse(null);

    try {
      setProgress(prev => [...prev, 'Processing image...']);
      
      const result = await geminiService.processImage(imageUrl, prompt, model);
      
      console.log('useGemini - processImage result:', result);
      console.log('useGemini - result type:', typeof result);
      console.log('useGemini - has analysis:', !!result?.analysis);
      
      if (result) {
        setIsProcessing(false);
        setProgress([]);
        return result;
      } else {
        throw new Error('No output received from Gemini');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      
      // Check if Gemini provided a text response instead of image
      if (err instanceof Error && (err as any).geminiTextResponse) {
        const textResponse = (err as any).geminiTextResponse;
        setGeminiTextResponse(textResponse);
        setError(`Gemini responded with text instead of image: ${errorMessage}`);
      } else {
        setError(errorMessage);
      }
      
      setIsProcessing(false);
      setProgress([]);
      return null;
    }
  }, []);


  // Clear error
  const clearError = useCallback(() => {
    setError(null);
    setGeminiTextResponse(null);
  }, []);

  return {
    isProcessing,
    progress,
    error,
    geminiTextResponse,
    processImage,
    clearError,
    availableModels,
    editingPresets,
  };
};