import { useState, useCallback } from 'react';
import { geminiService, GEMINI_MODELS, GEMINI_PROMPTS } from '../services/gemini';
import type { GeminiModel, GeminiProcessResult } from '../services/gemini';

export interface EditingPreset {
  id: string;
  name: string;
  category: string;
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

  // Editing presets - Refined food photography styles
  const editingPresets: EditingPreset[] = [
    // FOOD STYLES 🍽️
    {
      id: 'overhead',
      name: 'Overhead Flat Lay',
      category: 'FOOD STYLES',
      description: 'Top-down composition',
      prompt: GEMINI_PROMPTS.OVERHEAD_FLAT_LAY,
      icon: 'camera',
    },
    {
      id: 'texture',
      name: 'Texture Close-Up',
      category: 'FOOD STYLES',
      description: 'Macro detail shot',
      prompt: GEMINI_PROMPTS.TEXTURE_CLOSE_UP,
      icon: 'search',
    },
    {
      id: 'delivery',
      name: 'Delivery Ready',
      category: 'FOOD STYLES',
      description: 'Food delivery style',
      prompt: GEMINI_PROMPTS.DELIVERY_READY,
      icon: 'package',
    },
    {
      id: 'finedining',
      name: 'Fine Dining',
      category: 'FOOD STYLES',
      description: 'Elegant plating',
      prompt: GEMINI_PROMPTS.FINE_DINING,
      icon: 'utensils',
    },
    // LIGHTING & MOOD 💡
    {
      id: 'dramatic',
      name: 'Dramatic Restaurant',
      category: 'LIGHTING & MOOD',
      description: 'Warm ambiance',
      prompt: GEMINI_PROMPTS.DRAMATIC_RESTAURANT,
      icon: 'star',
    },
    {
      id: 'softlight',
      name: 'Soft Studio Light',
      category: 'LIGHTING & MOOD',
      description: 'High-key lighting',
      prompt: GEMINI_PROMPTS.SOFT_STUDIO_LIGHT,
      icon: 'lightbulb',
    },
    {
      id: 'studio',
      name: 'Studio Quality',
      category: 'LIGHTING & MOOD',
      description: 'Professional DSLR',
      prompt: GEMINI_PROMPTS.STUDIO_QUALITY,
      icon: 'aperture',
    },
    {
      id: 'daylight',
      name: 'Natural Daylight',
      category: 'LIGHTING & MOOD',
      description: 'Bright & fresh',
      prompt: GEMINI_PROMPTS.NATURAL_DAYLIGHT,
      icon: 'sun',
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