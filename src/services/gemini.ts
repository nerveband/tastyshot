// Client-side service for Google Gemini AI API interactions

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
    description: 'Advanced vision model for image analysis and description (Note: Returns analysis, not edited images)',
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

// Enhancement prompts for food photography
export const GEMINI_PROMPTS = {
  ENHANCE: 'Enhance this food photo to look more appetizing, vibrant, and professional. Improve lighting, colors, and composition while maintaining the authentic look of the dish.',
  DRAMATIC: 'Transform this food photo with dramatic lighting, deep shadows, and rich contrasts. Create a moody, cinematic atmosphere that highlights textures and details.',
  VINTAGE: 'Give this food photo a vintage film aesthetic with warm tones, subtle grain, and nostalgic color grading. Make it look like it was shot on classic film stock.',
  BW: 'Convert this food photo to black and white with professional contrast, emphasizing textures, shapes, and composition. Create an artistic monochrome image.',
  PRO_EDIT: 'Apply professional food photography editing: perfect white balance, enhanced details, studio-quality lighting, and magazine-ready presentation.',
  ARTISTIC: 'Create an artistic interpretation of this food photo with creative effects, unique perspective, and stylized presentation while keeping it appetizing.'
};

interface GeminiResponse {
  id: string;
  status: 'succeeded' | 'failed' | 'processing';
  output?: string[];
  text?: string;
  error?: string | null;
}

class GeminiService {
  private apiEndpoint: string;

  constructor() {
    // Use the API route for serverless function
    this.apiEndpoint = '/api/gemini';
  }

  /**
   * Process an image with Gemini AI
   */
  async processImage(
    imageDataURL: string,
    prompt: string,
    model: GeminiModel = DEFAULT_GEMINI_MODEL
  ): Promise<string> {
    try {
      console.log('=== GEMINI SERVICE: processImage ===');
      console.log('Model:', model.name);
      console.log('Prompt:', prompt);
      console.log('Image size:', imageDataURL.length);

      // Always use generateContent action for gemini-2.5-flash-image-preview
      const action = 'generateContent';
      
      // Prepare the request body
      const requestBody = {
        action,
        model: model.modelId,
        input: {
          image: imageDataURL,
          prompt: prompt
        }
      };

      console.log('Sending request to:', this.apiEndpoint);
      console.log('Action:', action);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(error.details || error.error || 'Failed to process image');
      }

      const result: GeminiResponse = await response.json();
      console.log('API result:', result);

      // Check for errors in the response
      if (result.error) {
        throw new Error(result.error);
      }

      // Extract the image URL from the response
      if (result.output && result.output.length > 0) {
        const outputImage = result.output[0];
        console.log('Output image received, length:', outputImage.length);
        return outputImage;
      }

      throw new Error('No output image generated');
    } catch (error) {
      console.error('Gemini service error:', error);
      throw error;
    }
  }


  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'OPTIONS',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();