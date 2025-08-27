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