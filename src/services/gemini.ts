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
    description: '🔍 AI Vision Analysis - Provides detailed descriptions and analysis of your food photos (Does not edit images)',
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

export interface GeminiProcessResult {
  image: string;
  analysis: string | null;
}

class GeminiService {
  private apiEndpoint: string;

  constructor() {
    // Use the API route for serverless function
    this.apiEndpoint = '/api/gemini';
  }

  /**
   * Compress image to prevent 413 errors
   */
  private async compressImage(dataURL: string, maxSizeMB: number = 4): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Calculate new dimensions to keep under size limit
        let { width, height } = img;
        const maxDimension = 1024;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels until under size limit
        let quality = 0.8;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        while (result.length > maxSizeMB * 1024 * 1024 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(result);
      };
      img.src = dataURL;
    });
  }

  /**
   * Process an image with Gemini AI
   */
  async processImage(
    imageDataURL: string,
    prompt: string,
    model: GeminiModel = DEFAULT_GEMINI_MODEL
  ): Promise<GeminiProcessResult> {
    try {
      console.log('=== GEMINI SERVICE: processImage ===');
      console.log('Model:', model.name);
      console.log('Prompt:', prompt);
      console.log('Original image size:', imageDataURL.length);

      // Compress image if it's too large (prevent 413 errors)
      let processedImage = imageDataURL;
      if (imageDataURL.length > 4 * 1024 * 1024) { // 4MB limit
        console.log('Compressing large image...');
        processedImage = await this.compressImage(imageDataURL);
        console.log('Compressed image size:', processedImage.length);
      }

      // Always use generateContent action for gemini-2.5-flash-image-preview
      const action = 'generateContent';
      
      // Prepare the request body
      const requestBody = {
        action,
        model: model.modelId,
        input: {
          image: processedImage,
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

      // Extract the image and text from the response
      if (result.output && result.output.length > 0) {
        const outputImage = result.output[0];
        console.log('Output image received, length:', outputImage.length);
        console.log('Analysis text:', result.text ? result.text.substring(0, 100) + '...' : 'No text');
        
        return {
          image: outputImage,
          analysis: result.text || null
        };
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