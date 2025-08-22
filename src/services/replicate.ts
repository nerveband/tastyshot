import Replicate from 'replicate';
import type { ReplicateModelSettings, UpscaleSettings, ReplicateResponse } from '../types';

const replicate = new Replicate({
  auth: import.meta.env.VITE_REPLICATE_API_TOKEN,
});

export const replicateService = {
  // Image editing using Qwen Image Edit model
  editImage: async (
    imageUrl: string, 
    settings: ReplicateModelSettings
  ): Promise<ReplicateResponse> => {
    try {
      const prediction = await replicate.predictions.create({
        version: "qwen/qwen-image-edit",
        input: {
          image: imageUrl,
          prompt: settings.prompt,
          aspect_ratio: settings.aspect_ratio || "1:1",
          go_fast: settings.go_fast ?? true,
          seed: settings.seed,
          output_format: settings.output_format || "webp",
          output_quality: settings.output_quality || 80,
          disable_safety_checker: settings.disable_safety_checker ?? false,
        },
        stream: true,
      });

      return {
        id: prediction.id,
        status: prediction.status as any,
        urls: prediction.urls,
        output: prediction.output as string[],
        error: prediction.error as string,
      };
    } catch (error) {
      console.error('Replicate API error:', error);
      throw new Error(`Failed to process image: ${error}`);
    }
  },

  // Image upscaling using Google upscaler
  upscaleImage: async (
    imageUrl: string, 
    settings: UpscaleSettings
  ): Promise<ReplicateResponse> => {
    try {
      const prediction = await replicate.predictions.create({
        version: "google/upscaler",
        input: {
          image: imageUrl,
          upscale_factor: settings.upscale_factor,
          compression_quality: settings.compression_quality,
        },
        stream: true,
      });

      return {
        id: prediction.id,
        status: prediction.status as any,
        urls: prediction.urls,
        output: prediction.output as string[],
        error: prediction.error as string,
      };
    } catch (error) {
      console.error('Replicate upscale error:', error);
      throw new Error(`Failed to upscale image: ${error}`);
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
    } catch (error) {
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

  // Predefined editing prompts for the UI
  getEditingPresets: () => [
    {
      id: 'enhance',
      name: 'ENHANCE',
      description: 'Improve colors and sharpness',
      prompt: 'Enhance the image by improving colors, contrast, and sharpness while maintaining natural look',
      icon: '✨',
      cost: 1,
    },
    {
      id: 'dramatic',
      name: 'DRAMATIC',
      description: 'Add dramatic lighting and mood',
      prompt: 'Transform this image with dramatic lighting, enhanced shadows and highlights for cinematic effect',
      icon: '🎭',
      cost: 1,
    },
    {
      id: 'vintage',
      name: 'VINTAGE',
      description: 'Apply vintage film aesthetic',
      prompt: 'Apply a vintage film aesthetic with warm tones, subtle grain, and classic color grading',
      icon: '📸',
      cost: 1,
    },
    {
      id: 'blackwhite',
      name: 'B&W',
      description: 'Convert to artistic black and white',
      prompt: 'Convert to stunning black and white with enhanced contrast and artistic tonal balance',
      icon: '⚫',
      cost: 1,
    },
    {
      id: 'professional',
      name: 'PRO EDIT',
      description: 'Professional photography edit',
      prompt: 'Apply professional photography editing with color correction, exposure adjustment, and detail enhancement',
      icon: '📷',
      cost: 2,
    },
    {
      id: 'artistic',
      name: 'ARTISTIC',
      description: 'Creative artistic transformation',
      prompt: 'Transform into an artistic masterpiece with enhanced colors, creative effects, and artistic interpretation',
      icon: '🎨',
      cost: 2,
    },
  ],
};