import { useState, useCallback } from 'react';
import { replicateService } from '../services/replicate';
import type { ReplicateModelSettings, UpscaleSettings } from '../types';

export const useReplicate = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Edit image using Replicate API
  const editImage = useCallback(async (
    imageUrl: string,
    settings: ReplicateModelSettings
  ): Promise<string | null> => {
    setIsProcessing(true);
    setProgress([]);
    setError(null);

    try {
      const result = await replicateService.editImage(imageUrl, settings);
      
      console.log('useReplicate - editImage service result:', result);
      console.log('useReplicate - result.status:', result.status);
      console.log('useReplicate - result.output:', result.output);
      console.log('useReplicate - result.output[0]:', result.output?.[0]);
      
      // Since we're using replicate.run() on the server, the result is already complete
      if (result.status === 'succeeded' && result.output && result.output.length > 0) {
        setIsProcessing(false);
        const editedImageUrl = result.output[0];
        console.log('useReplicate - returning edited image URL:', editedImageUrl);
        console.log('useReplicate - URL type:', typeof editedImageUrl);
        console.log('useReplicate - URL length:', editedImageUrl?.length);
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
      if (result.status === 'succeeded' && result.output && result.output.length > 0) {
        setIsProcessing(false);
        return result.output[0];
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

  // Get editing presets
  const editingPresets = replicateService.getEditingPresets();

  return {
    isProcessing,
    progress,
    error,
    editImage,
    upscaleImage,
    clearError,
    clearProgress,
    editingPresets,
  };
};