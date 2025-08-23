import type { ReplicateModelSettings, UpscaleSettings, ReplicateResponse } from '../types';

export const replicateService = {
  // Image editing using SeedEdit 3.0 model via server-side API
  editImage: async (
    imageUrl: string, 
    settings: ReplicateModelSettings
  ): Promise<ReplicateResponse> => {
    try {
      console.log('Client-side editImage called with:');
      console.log('- Image URL type:', typeof imageUrl);
      console.log('- Image URL length:', imageUrl.length);
      console.log('- Image URL starts with:', imageUrl.substring(0, 30));
      console.log('- Settings:', settings);
      
      // Validate image data
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image data provided');
      }
      
      // Call our serverless API route instead of Replicate directly
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run',
          model: 'bytedance/seededit-3.0',
          input: {
            image: imageUrl,
            prompt: settings.prompt || "Enhance the image quality and improve lighting",
            negative_prompt: settings.negative_prompt || "blurry, low quality, distorted",
            guidance_scale: settings.guidance_scale || 7.5,
            num_inference_steps: settings.num_inference_steps || 20,
            seed: settings.seed || Math.floor(Math.random() * 1000000),
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Server error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Server-side SeedEdit 3.0 result:', result);

      return result;
    } catch (error: any) {
      console.error('Client-side Replicate error:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
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

  // Image upscaling using Real-ESRGAN via server-side API
  upscaleImage: async (
    imageUrl: string, 
    settings: UpscaleSettings
  ): Promise<ReplicateResponse> => {
    try {
      console.log('Client-side upscaleImage called with:', { imageUrl: imageUrl.substring(0, 50) + '...', settings });
      
      // Call our serverless API route for upscaling
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run',
          model: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
          input: {
            image: imageUrl,
            scale: settings.upscale_factor === 'x2' ? 2 : 4,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Server error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Server-side upscale result:', result);

      return result;
    } catch (error: any) {
      console.error('Client-side upscale error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      if (error instanceof Error) {
        throw new Error(`Failed to upscale image: ${error.message}`);
      } else {
        throw new Error(`Failed to upscale image: ${JSON.stringify(error)}`);
      }
    }
  },

  // Get prediction status via server-side API
  getPrediction: async (predictionId: string): Promise<ReplicateResponse> => {
    try {
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get',
          input: { id: predictionId }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      return result;
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