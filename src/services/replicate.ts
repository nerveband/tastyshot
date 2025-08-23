import Replicate from 'replicate';
import type { ReplicateModelSettings, UpscaleSettings, ReplicateResponse } from '../types';

const replicate = new Replicate({
  auth: import.meta.env.VITE_REPLICATE_API_TOKEN,
});

export const replicateService = {
  // Image editing using Stable Diffusion (known working model)
  editImage: async (
    imageUrl: string, 
    settings: ReplicateModelSettings
  ): Promise<ReplicateResponse> => {
    try {
      // Validate API token
      const apiToken = import.meta.env.VITE_REPLICATE_API_TOKEN;
      if (!apiToken) {
        throw new Error('Replicate API token is missing. Check VITE_REPLICATE_API_TOKEN environment variable.');
      }
      
      console.log('Replicate editImage called with:');
      console.log('- Image URL type:', typeof imageUrl);
      console.log('- Image URL length:', imageUrl.length);
      console.log('- Image URL starts with:', imageUrl.substring(0, 30));
      console.log('- Settings:', settings);
      console.log('- API Token exists and starts with:', apiToken.substring(0, 8) + '...');
      
      // Validate image data
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image data provided');
      }
      
      // First test with simple upscaler to verify API connection works
      const prediction = await replicate.predictions.create({
        version: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        input: {
          image: imageUrl,
          scale: 2, // Just upscale 2x for now
        },
      });

      console.log('Replicate prediction created successfully:', prediction);

      return {
        id: prediction.id,
        status: prediction.status as any,
        urls: prediction.urls,
        output: prediction.output as string[],
        error: prediction.error as string,
      };
    } catch (error: any) {
      console.error('Replicate API error:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Try to extract more specific error information
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      throw new Error(`Image processing failed: ${errorMessage}`);
    }
  },

  // Image upscaling using Real-ESRGAN
  upscaleImage: async (
    imageUrl: string, 
    settings: UpscaleSettings
  ): Promise<ReplicateResponse> => {
    try {
      console.log('Replicate upscaleImage called with:', { imageUrl: imageUrl.substring(0, 50) + '...', settings });
      
      // Use Real-ESRGAN upscaler with correct version hash
      const prediction = await replicate.predictions.create({
        version: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        input: {
          image: imageUrl,
          scale: settings.upscale_factor === 'x2' ? 2 : 4,
        },
      });

      console.log('Replicate upscale prediction created:', prediction);

      return {
        id: prediction.id,
        status: prediction.status as any,
        urls: prediction.urls,
        output: prediction.output as string[],
        error: prediction.error as string,
      };
    } catch (error: any) {
      console.error('Replicate upscale error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        throw new Error(`Failed to upscale image: ${error.message}`);
      } else {
        throw new Error(`Failed to upscale image: ${JSON.stringify(error)}`);
      }
    }
  },

  // Get prediction status
  getPrediction: async (predictionId: string): Promise<ReplicateResponse> => {
    try {
      const prediction = await replicate.predictions.get(predictionId);
      
      return {
        id: prediction.id,
        status: prediction.status as any,
        urls: prediction.urls,
        output: prediction.output as string[],
        error: prediction.error as string,
      };
    } catch (error: any) {
      console.error('Failed to get prediction:', error);
      throw new Error(`Failed to get prediction status: ${error}`);
    }
  },

  // Stream prediction updates using EventSource
  streamPrediction: (
    streamUrl: string,
    onOutput: (data: string) => void,
    onError: (error: string) => void,
    onDone: (data: any) => void
  ): EventSource => {
    const eventSource = new EventSource(streamUrl, {
      withCredentials: true,
    });

    eventSource.addEventListener('output', (e) => {
      onOutput(e.data);
    });

    eventSource.addEventListener('error', (e: any) => {
      const errorData = JSON.parse(e.data);
      onError(errorData);
      eventSource.close();
    });

    eventSource.addEventListener('done', (e) => {
      const doneData = JSON.parse(e.data);
      onDone(doneData);
      eventSource.close();
    });

    return eventSource;
  },

  // Predefined editing prompts for SeedEdit 3.0
  getEditingPresets: () => [
    {
      id: 'enhance',
      name: 'ENHANCE',
      description: 'Improve colors and lighting',
      prompt: 'Improve the lighting and enhance the colors to make them more vibrant',
      icon: '✨',
      cost: 1,
    },
    {
      id: 'dramatic',
      name: 'DRAMATIC',
      description: 'Add dramatic mood lighting',
      prompt: 'Change the lighting to create a dramatic, cinematic mood with enhanced shadows',
      icon: '🎭',
      cost: 1,
    },
    {
      id: 'vintage',
      name: 'VINTAGE',
      description: 'Apply vintage film look',
      prompt: 'Change the style to vintage film photography with warm sepia tones',
      icon: '📸',
      cost: 1,
    },
    {
      id: 'blackwhite',
      name: 'B&W',
      description: 'Convert to black and white',
      prompt: 'Convert the image to black and white with high contrast',
      icon: '⚫',
      cost: 1,
    },
    {
      id: 'professional',
      name: 'PRO EDIT',
      description: 'Professional studio lighting',
      prompt: 'Change the lighting to professional studio lighting with perfect exposure',
      icon: '📷',
      cost: 2,
    },
    {
      id: 'sunset',
      name: 'SUNSET',
      description: 'Golden hour lighting',
      prompt: 'Change the lighting to golden hour sunset lighting with warm tones',
      icon: '🌅',
      cost: 1,
    },
  ],
};