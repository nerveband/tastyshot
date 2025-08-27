import { useState, useCallback } from 'react';
import { replicateService } from '../services/replicate';
import type { AIModel, ReplicateModelSettings, UpscaleSettings } from '../types';

export const useReplicate = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Feature flag check
  const enableReplicateModels = import.meta.env.VITE_ENABLE_REPLICATE_MODELS === 'true';

  // Run model using Replicate API
  const runModel = useCallback(async (
    model: AIModel,
    imageUrl: string,
    settings: ReplicateModelSettings
  ): Promise<string | null> => {
    setIsProcessing(true);
    setProgress([]);
    setError(null);

    try {
      const result = await replicateService.runModel(model, imageUrl, settings);
      
      console.log('useReplicate - runModel service result:', result);
      console.log('useReplicate - result.status:', result.status);
      console.log('useReplicate - result.output:', result.output);
      console.log('useReplicate - result.output[0]:', result.output?.[0]);
      
      // Since we're using replicate.run() on the server, the result is already complete
      // The serverless function now handles FileOutput extraction and returns string URLs
      if (result.status === 'succeeded' && result.output && result.output.length > 0) {
        setIsProcessing(false);
        const editedImageUrl = result.output[0];
        console.log('useReplicate - received processed image URL:', editedImageUrl);
        console.log('useReplicate - URL type:', typeof editedImageUrl);
        console.log('useReplicate - URL length:', editedImageUrl?.length);
        console.log('useReplicate - URL starts with:', editedImageUrl?.substring(0, 30));
        
        // The serverless function should have already extracted the URL from FileOutput
        if (typeof editedImageUrl !== 'string') {
          console.error('Expected string URL but got:', typeof editedImageUrl, editedImageUrl);
          throw new Error('Invalid image URL format from server');
        }
        
        return editedImageUrl;
      } else if (result.error) {
        throw new Error(result.error);
      } else {
        throw new Error('No output received from model');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setIsProcessing(false);
      return null;
    }
  }, []);

  // Upscale image
  const upscaleImage = useCallback(async (
    imageUrl: string,
    settings: UpscaleSettings
  ): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await replicateService.upscaleImage(imageUrl, settings);
      
      // Since we're using replicate.run() on the server, the result is already complete  
      // The serverless function now handles FileOutput extraction and returns string URLs
      if (result.status === 'succeeded' && result.output && result.output.length > 0) {
        setIsProcessing(false);
        const upscaledImageUrl = result.output[0];
        
        // The serverless function should have already extracted the URL from FileOutput
        if (typeof upscaledImageUrl !== 'string') {
          console.error('Expected string URL but got:', typeof upscaledImageUrl, upscaledImageUrl);
          throw new Error('Invalid upscaled image URL format from server');
        }
        
        return upscaledImageUrl;
      } else if (result.error) {
        throw new Error(result.error);
      } else {
        throw new Error('No output received from upscaler');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upscaling failed');
      setIsProcessing(false);
      return null;
    }
  }, []);

  // Legacy method for backward compatibility
  const editImage = useCallback(async (
    imageUrl: string,
    settings: ReplicateModelSettings
  ): Promise<string | null> => {
    const defaultModel = replicateService.getAvailableModels()[0];
    return runModel(defaultModel, imageUrl, settings);
  }, [runModel]);

  // Note: Polling is no longer needed since we use replicate.run() on the server
  // which waits for completion before returning the result

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear progress
  const clearProgress = useCallback(() => {
    setProgress([]);
  }, []);

  // Get available models (empty if feature flag disabled)
  const availableModels = enableReplicateModels ? replicateService.getAvailableModels() : [];

  // Get editing presets (empty if feature flag disabled)
  const editingPresets = enableReplicateModels ? replicateService.getEditingPresets() : [];

  return {
    isProcessing,
    progress,
    error,
    runModel,
    editImage, // Keep for backward compatibility
    upscaleImage,
    clearError,
    clearProgress,
    availableModels,
    editingPresets,
  };
};