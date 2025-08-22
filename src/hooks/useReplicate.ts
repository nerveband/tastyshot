import { useState, useCallback } from 'react';
import { replicateService } from '../services/replicate';
import type { ReplicateModelSettings, UpscaleSettings } from '../types';

export const useReplicate = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Edit image with streaming updates
  const editImage = useCallback(async (
    imageUrl: string,
    settings: ReplicateModelSettings,
    onProgress?: (output: string) => void
  ): Promise<string | null> => {
    setIsProcessing(true);
    setProgress([]);
    setError(null);

    try {
      const prediction = await replicateService.editImage(imageUrl, settings);
      
      if (prediction.urls?.stream) {
        // Stream the results
        return new Promise((resolve, reject) => {
          const eventSource = replicateService.streamPrediction(
            prediction.urls!.stream!,
            (output) => {
              setProgress(prev => [...prev, output]);
              onProgress?.(output);
            },
            (error) => {
              setError(error);
              setIsProcessing(false);
              reject(new Error(error));
            },
            (result) => {
              setIsProcessing(false);
              if (result && result.output && result.output.length > 0) {
                resolve(result.output[0]);
              } else {
                reject(new Error('No output received'));
              }
            }
          );

          // Cleanup on timeout
          setTimeout(() => {
            eventSource.close();
            setIsProcessing(false);
            reject(new Error('Processing timeout'));
          }, 60000); // 1 minute timeout
        });
      } else {
        // Fallback: poll for results
        return await pollForResult(prediction.id);
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
      const prediction = await replicateService.upscaleImage(imageUrl, settings);
      return await pollForResult(prediction.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upscaling failed');
      setIsProcessing(false);
      return null;
    }
  }, []);

  // Poll for prediction result
  const pollForResult = async (predictionId: string): Promise<string | null> => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const prediction = await replicateService.getPrediction(predictionId);
        
        if (prediction.status === 'succeeded') {
          setIsProcessing(false);
          return prediction.output?.[0] || null;
        } else if (prediction.status === 'failed') {
          setIsProcessing(false);
          throw new Error(prediction.error || 'Processing failed');
        }
        
        // Wait 10 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Polling failed');
        setIsProcessing(false);
        return null;
      }
    }

    setError('Processing timeout');
    setIsProcessing(false);
    return null;
  };

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