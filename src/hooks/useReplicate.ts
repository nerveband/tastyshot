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
        const outputItem = result.output[0];
        console.log('useReplicate - output item:', outputItem);
        console.log('useReplicate - output item type:', typeof outputItem);
        
        // Handle different output formats from Replicate models
        let editedImageUrl: string;
        if (typeof outputItem === 'string') {
          // Direct URL string
          editedImageUrl = outputItem;
        } else if (outputItem && typeof outputItem === 'object') {
          // Object with URL property - check common property names
          if (outputItem.url) {
            editedImageUrl = outputItem.url;
          } else if (outputItem.image) {
            editedImageUrl = outputItem.image;
          } else if (outputItem.output) {
            editedImageUrl = outputItem.output;
          } else {
            console.error('Unknown output object structure:', Object.keys(outputItem));
            throw new Error('Unable to extract image URL from model output');
          }
        } else {
          throw new Error('Invalid output format from model');
        }
        
        console.log('useReplicate - extracted image URL:', editedImageUrl);
        console.log('useReplicate - URL type:', typeof editedImageUrl);
        console.log('useReplicate - URL length:', editedImageUrl?.length);
        console.log('useReplicate - URL starts with:', editedImageUrl?.substring(0, 30));
        
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
        const outputItem = result.output[0];
        
        // Handle different output formats from Replicate models
        let upscaledImageUrl: string;
        if (typeof outputItem === 'string') {
          upscaledImageUrl = outputItem;
        } else if (outputItem && typeof outputItem === 'object') {
          if (outputItem.url) {
            upscaledImageUrl = outputItem.url;
          } else if (outputItem.image) {
            upscaledImageUrl = outputItem.image;
          } else if (outputItem.output) {
            upscaledImageUrl = outputItem.output;
          } else {
            console.error('Unknown upscale output object structure:', Object.keys(outputItem));
            throw new Error('Unable to extract image URL from upscaler output');
          }
        } else {
          throw new Error('Invalid output format from upscaler');
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