// Direct client-side service for Google Gemini AI API interactions
// Based on proven gembooth implementation that works perfectly

import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from '@google/genai';
import pLimit from 'p-limit';

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  modelId: string;
  defaultSettings: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
  };
  estimatedTime: string;
  cost: number;
}

// Available Gemini models
export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: 'gemini-2.5-flash-image-preview',
    name: 'Gemini 2.5 Flash Image Preview',
    description: '🎨 Advanced AI Image Generation & Editing - Creates and edits images with conversational prompts and exceptional detail',
    provider: 'Google',
    modelId: 'gemini-2.5-flash-image-preview',
    defaultSettings: {
      temperature: 1.0,
      maxOutputTokens: 8192,
      topP: 0.95,
    },
    estimatedTime: '5-15 seconds',
    cost: 1
  }
];

// Default model
export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS[0];

// Image editing prompts for Gemini 2.5 Flash Image Preview - Refined food photography styles
export const GEMINI_PROMPTS = {
  // FOOD STYLES
  OVERHEAD_FLAT_LAY: 'Using the provided image, transform into overhead flat lay style with complete table setup, props, and styled composition',
  TEXTURE_CLOSE_UP: 'Using the provided image, create macro close-up highlighting food textures, moisture, and appetizing details',
  DELIVERY_READY: 'Using the provided image, place food in an open eco-friendly container on white background, flat lay without utensils, professional delivery app style',
  FINE_DINING: 'Using the provided image, style as elegant fine dining presentation with sophisticated plating on premium dinnerware',
  // LIGHTING & MOOD
  DRAMATIC_RESTAURANT: 'Using the provided image, apply dramatic restaurant lighting with warm ambiance and strategic shadows',
  SOFT_STUDIO_LIGHT: 'Using the provided image, apply soft, high-key studio lighting with even illumination and minimal shadows',
  STUDIO_QUALITY: 'Using the provided image, transform into professional DSLR studio photo with perfect lighting and sharp focus',
  NATURAL_DAYLIGHT: 'Using the provided image, enhance with bright natural daylight for fresh, clean food photography'
};

export interface GeminiProcessResult {
  image: string;
  analysis: string | null;
}

// Direct client-side API configuration - same as gembooth
const timeoutMs = 123_333;
const maxRetries = 5;
const baseDelay = 1_233;

// Initialize Google AI client directly
// Use the VITE_GEMINI_API_KEY for client-side access in Vite
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || ''
});

// Safety settings for image generation
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE
  }
];

// Rate limiter to prevent API overload
const limit = pLimit(2);

// Rate limited function to prevent API overload
const processWithGemini = async ({ model, prompt, inputFile, signal }: {
  model: string;
  prompt: string;
  inputFile: string;
  signal?: AbortSignal;
}): Promise<string> => {
  return limit(async () => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs)
        );

        const modelPromise = ai.models.generateContent({
          model,
          config: { 
            responseModalities: [Modality.TEXT, Modality.IMAGE],
            safetySettings
          },
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                ...(inputFile
                  ? [
                      {
                        inlineData: {
                          data: inputFile.split(',')[1],
                          mimeType: inputFile.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
                        }
                      }
                    ]
                  : [])
              ]
            }
          ]
        });

        const response = await Promise.race([modelPromise, timeoutPromise]);

        console.log('Gemini API response received:', JSON.stringify({
          candidatesCount: response.candidates?.length || 0,
          firstCandidate: response.candidates?.[0] ? {
            role: response.candidates[0].content?.role,
            partsCount: response.candidates[0].content?.parts?.length || 0,
            parts: response.candidates[0].content?.parts?.map(p => ({
              hasText: !!p.text,
              hasInlineData: !!p.inlineData,
              textLength: p.text?.length || 0
            }))
          } : null
        }, null, 2));

        if (!response.candidates || response.candidates.length === 0) {
          throw new Error('No candidates in response');
        }

        const inlineDataPart = response.candidates[0]?.content?.parts?.find(
          p => p.inlineData
        );
        if (!inlineDataPart?.inlineData) {
          // Try to get text response as well for debugging
          const textPart = response.candidates[0]?.content?.parts?.find(p => p.text);
          const textResponse = textPart?.text || 'No text response available';
          console.error('No inline data found. Text response:', textResponse);
          
          // Create a special error that includes the text response
          const error = new Error('No inline data found in response');
          (error as any).geminiTextResponse = textResponse;
          throw error;
        }

        return 'data:image/png;base64,' + inlineDataPart.inlineData.data;
      } catch (error: unknown) {
        if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
          throw new Error('Request aborted');
        }

        if (attempt === maxRetries - 1) {
          throw error;
        }

        const delay = baseDelay * 2 ** attempt;
        await new Promise(res => setTimeout(res, delay));
        console.warn(
          `Attempt ${attempt + 1} failed, retrying after ${delay}ms...`
        );
      }
    }
    throw new Error('All retry attempts failed');
  });
};

class GeminiService {
  /**
   * Process an image with Gemini AI using direct client-side API calls
   * This mirrors the proven gembooth implementation
   */
  async processImage(
    imageDataURL: string,
    prompt: string,
    model: GeminiModel = DEFAULT_GEMINI_MODEL
  ): Promise<GeminiProcessResult> {
    try {
      console.log('=== GEMINI SERVICE: processImage (Direct API) ===');
      console.log('Model:', model.name);
      console.log('Prompt:', prompt);
      console.log('Image size:', imageDataURL.length);

      // Call Gemini API directly using the gembooth approach
      const result = await processWithGemini({
        model: model.modelId,
        prompt,
        inputFile: imageDataURL
      });

      console.log('Gemini API success, image generated');
      
      return {
        image: result,
        analysis: null // gembooth doesn't return analysis text, focus on image generation
      };
    } catch (error) {
      console.error('Gemini service error:', error);
      
      // Check if this is a special error with Gemini's text response
      if (error instanceof Error && (error as any).geminiTextResponse) {
        const textResponse = (error as any).geminiTextResponse;
        const enhancedError = new Error(error.message);
        (enhancedError as any).geminiTextResponse = textResponse;
        throw enhancedError;
      }
      
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Simple check - verify API key is present
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
      return !!apiKey;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();