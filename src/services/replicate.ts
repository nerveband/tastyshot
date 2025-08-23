import type { AIModel, ReplicateModelSettings, UpscaleSettings, ReplicateResponse, FluxKontextSettings } from '../types';

export const replicateService = {
  // Run any AI model via server-side API
  runModel: async (
    model: AIModel,
    imageUrl: string, 
    settings: ReplicateModelSettings
  ): Promise<ReplicateResponse> => {
    try {
      console.log('Client-side runModel called with:');
      console.log('- Model:', model.name, model.replicateModel);
      console.log('- Image URL type:', typeof imageUrl);
      console.log('- Image URL length:', imageUrl.length);
      console.log('- Image URL starts with:', imageUrl.substring(0, 30));
      console.log('- Settings:', settings);
      
      // Validate image data
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image data provided');
      }
      
      // Build input based on model type
      const input = replicateService.buildModelInput(model, imageUrl, settings);
      console.log('- Built input:', input);
      
      // Call our serverless API route instead of Replicate directly
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run',
          model: model.replicateModel,
          input
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Server error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Server-side model result:', result);

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
      
      throw new Error(`Model processing failed: ${errorMessage}`);
    }
  },

  // Legacy method for backward compatibility
  editImage: async (
    imageUrl: string, 
    settings: ReplicateModelSettings
  ): Promise<ReplicateResponse> => {
    // Use SeedEdit 3.0 as default for backward compatibility
    const defaultModel = replicateService.getAvailableModels()[0];
    return replicateService.runModel(defaultModel, imageUrl, settings);
  },

  // Build input parameters based on model type
  buildModelInput: (model: AIModel, imageUrl: string, settings: ReplicateModelSettings): any => {
    const baseInput = {
      image: imageUrl,
      seed: settings.seed || Math.floor(Math.random() * 1000000),
    };

    // Handle different model types
    switch (model.id) {
      case 'flux-kontext-dev':
      case 'flux-kontext-pro':
        const fluxKontextSettings = settings as FluxKontextSettings;
        return {
          ...baseInput,
          prompt: fluxKontextSettings.prompt || "Enhance this image with improved lighting, better color correction, increased sharpness and detail, professional quality adjustments, and overall visual enhancement while maintaining natural appearance.",
          guidance_scale: fluxKontextSettings.guidance_scale || 3.5,
          num_inference_steps: fluxKontextSettings.num_inference_steps || 28,
          width: fluxKontextSettings.width || 1024,
          height: fluxKontextSettings.height || 1024,
        };

      case 'flux-fill-dev':
      case 'flux-fill-pro':
        const fluxFillSettings = settings as FluxKontextSettings;
        // Flux Fill models need a mask - for now we'll use the whole image
        return {
          ...baseInput,
          prompt: fluxFillSettings.prompt || "Enhance this image with improved lighting, better color correction, increased sharpness and detail, professional quality adjustments, and overall visual enhancement while maintaining natural appearance.",
          guidance_scale: fluxFillSettings.guidance_scale || 3.5,
          num_inference_steps: fluxFillSettings.num_inference_steps || 28,
          width: fluxFillSettings.width || 1024,
          height: fluxFillSettings.height || 1024,
        };

      default:
        console.warn('Unknown model type, using default input structure');
        return {
          ...baseInput,
          prompt: settings.prompt || "Enhance this image with improved lighting, better color correction, increased sharpness and detail, and professional quality adjustments while maintaining natural appearance.",
          guidance_scale: 3.5,
          num_inference_steps: 28,
        };
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

  // Get available AI models
  getAvailableModels: (): AIModel[] => [
    {
      id: 'flux-kontext-dev',
      name: 'Flux Kontext Dev',
      description: 'State-of-the-art text-guided image editing',
      provider: 'Black Forest Labs',
      category: 'image-editing',
      replicateModel: 'black-forest-labs/flux-kontext-dev',
      supportedInputs: ['camera', 'upload'],
      defaultSettings: {
        prompt: 'Enhance this image with improved brightness, increased color saturation, sharper details, and professional color correction. Adjust exposure levels for optimal lighting, boost vibrancy without oversaturation, and enhance overall image quality while maintaining natural appearance.',
        guidance_scale: 3.5,
        num_inference_steps: 28,
        width: 1024,
        height: 1024,
      } as FluxKontextSettings,
      estimatedTime: '30-60 seconds',
      cost: 2,
    },
    {
      id: 'flux-fill-dev',
      name: 'Flux Fill Dev',
      description: 'Professional-quality image editing and inpainting',
      provider: 'Black Forest Labs',
      category: 'image-editing',
      replicateModel: 'black-forest-labs/flux-fill-dev',
      supportedInputs: ['camera', 'upload'],
      defaultSettings: {
        prompt: 'Enhance this image with improved lighting, better color correction, increased sharpness and detail, professional quality adjustments, and overall visual enhancement while maintaining natural appearance.',
        guidance_scale: 3.5,
        num_inference_steps: 28,
        width: 1024,
        height: 1024,
      } as FluxKontextSettings,
      estimatedTime: '45-75 seconds',
      cost: 2,
    },
    {
      id: 'flux-kontext-pro',
      name: 'Flux Kontext Pro',
      description: 'Professional image editing with Flux technology',
      provider: 'Black Forest Labs',
      category: 'image-editing',
      replicateModel: 'black-forest-labs/flux-kontext-pro',
      supportedInputs: ['camera', 'upload'],
      defaultSettings: {
        prompt: 'Enhance this image with improved lighting, better color correction, increased sharpness and detail, professional quality adjustments, and overall visual enhancement while maintaining natural appearance.',
        guidance_scale: 3.5,
        num_inference_steps: 28,
        width: 1024,
        height: 1024,
      } as FluxKontextSettings,
      estimatedTime: '45-75 seconds',
      cost: 3,
    },
    {
      id: 'flux-fill-pro',
      name: 'Flux Fill Pro',
      description: 'Advanced inpainting and image editing',
      provider: 'Black Forest Labs',
      category: 'image-editing',
      replicateModel: 'black-forest-labs/flux-fill-pro',
      supportedInputs: ['camera', 'upload'],
      defaultSettings: {
        prompt: 'Improve this image by enhancing the lighting, adjusting colors for better saturation and balance, increasing sharpness and detail clarity, correcting exposure levels, and making professional quality adjustments while keeping a natural appearance.',
        num_inference_steps: 25,
        guidance_scale: 3.5,
      } as FluxKontextSettings,
      estimatedTime: '20-40 seconds',
      cost: 2,
    },
  ],

  // Predefined editing prompts for SeedEdit 3.0
  getEditingPresets: () => [
    {
      id: 'enhance',
      name: 'ENHANCE',
      description: 'Improve colors and lighting',
      prompt: 'Enhance this image with improved brightness, increased color saturation, sharper details, and professional color correction. Adjust exposure levels for optimal lighting, boost vibrancy without oversaturation, and enhance overall image quality while maintaining natural appearance.',
      icon: 'sparkles',
      cost: 1,
    },
    {
      id: 'dramatic',
      name: 'DRAMATIC',
      description: 'Add dramatic mood lighting',
      prompt: 'Transform this image with dramatic cinematic lighting effects. Add strong contrast with deep shadows and bright highlights, create moody atmospheric lighting, increase shadow depth, and apply cinematic color grading with enhanced contrast for a professional film look.',
      icon: 'drama',
      cost: 1,
    },
    {
      id: 'vintage',
      name: 'VINTAGE',
      description: 'Apply vintage film look',
      prompt: 'Convert this image to vintage film style with warm sepia tones, film grain texture, reduced saturation, faded edges, soft contrast, and aged photo appearance. Apply retro color grading with yellowed highlights and muted colors typical of old photographs.',
      icon: 'camera',
      cost: 1,
    },
    {
      id: 'blackwhite',
      name: 'B&W',
      description: 'Convert to black and white',
      prompt: 'Convert this image to high-contrast black and white photography. Remove all color information, increase contrast between light and dark areas, enhance details through grayscale optimization, and create dramatic monochrome effects with professional black and white processing.',
      icon: 'circle',
      cost: 1,
    },
    {
      id: 'professional',
      name: 'PRO EDIT',
      description: 'Professional studio lighting',
      prompt: 'Apply professional studio lighting effects to this image. Add even, diffused lighting, eliminate harsh shadows, create clean highlights, improve skin tones if present, add professional color correction, enhance clarity and sharpness, and optimize exposure for commercial photography quality.',
      icon: 'camera',
      cost: 2,
    },
    {
      id: 'sunset',
      name: 'SUNSET',
      description: 'Golden hour lighting',
      prompt: 'Transform this image with golden hour sunset lighting effects. Add warm orange and yellow tones, create soft directional lighting, enhance warm color temperature, add subtle lens flare effects, increase warmth in highlights, and create the magical glow of golden hour photography.',
      icon: 'sun',
      cost: 1,
    },
  ],
};