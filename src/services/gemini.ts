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

// Image editing prompts for Gemini 2.5 Flash Image Preview
export const GEMINI_PROMPTS = {
  ENHANCE: 'Using the provided image, create an enhanced version with improved lighting, more vibrant colors, better contrast, and professional food photography quality. Make the food look more appetizing while preserving the original composition.',
  DRAMATIC: 'Using the provided image, transform it with dramatic cinematic lighting, deep shadows, rich contrasts, and moody atmosphere. Create a professional, artistic look while keeping the food recognizable.',
  VINTAGE: 'Using the provided image, recreate it with a vintage film aesthetic - warm sepia tones, subtle film grain, faded edges, and nostalgic color grading typical of classic photography.',
  BW: 'Using the provided image, convert it to a high-contrast black and white photograph with professional monochrome processing, emphasizing textures and composition.',
  PRO_EDIT: 'Using the provided image, create a professional food photography version with perfect white balance, enhanced details, studio-quality lighting, and magazine-ready presentation.',
  ARTISTIC: 'Using the provided image, create an artistic interpretation with creative lighting effects, enhanced textures, and stylized presentation while maintaining the food\'s appeal.'
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
// Use the existing GEMINI_API_KEY from Vercel environment variables
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || ''
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
                          mimeType: 'image/jpeg'
                        }
                      }
                    ]
                  : [])
              ]
            }
          ]
        });

        const response = await Promise.race([modelPromise, timeoutPromise]);

        if (!response.candidates || response.candidates.length === 0) {
          throw new Error('No candidates in response');
        }

        const inlineDataPart = response.candidates[0]?.content?.parts?.find(
          p => p.inlineData
        );
        if (!inlineDataPart?.inlineData) {
          throw new Error('No inline data found in response');
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