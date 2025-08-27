import { useState, useRef, useCallback, useEffect } from 'react';
import { CameraService } from '../services/camera';

export const useCamera = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  const cameraServiceRef = useRef<CameraService>(new CameraService());
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize camera
  const initializeCamera = useCallback(async (facingMode: 'user' | 'environment' = 'environment') => {
    if (!videoRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await cameraServiceRef.current.initializeCamera(videoRef.current, facingMode);
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize camera');
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize camera with specific device
  const initializeCameraWithDevice = useCallback(async (deviceId: string) => {
    if (!videoRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await cameraServiceRef.current.initializeCameraWithDevice(videoRef.current, deviceId);
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize camera');
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!isInitialized) {
      setError('Camera not initialized');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const photoDataURL = await cameraServiceRef.current.capturePhoto();
      setCapturedPhoto(photoDataURL);
      return photoDataURL;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Switch camera (front/back)
  const switchCamera = useCallback(async () => {
    if (!isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await cameraServiceRef.current.switchCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch camera');
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Stop camera
  const stopCamera = useCallback(() => {
    cameraServiceRef.current.stopCamera();
    setIsInitialized(false);
    setCapturedPhoto(null);
    setError(null);
  }, []);

  // Convert photo to file
  const getPhotoFile = useCallback((dataURL: string, fileName: string): File => {
    return cameraServiceRef.current.dataURLToFile(dataURL, fileName);
  }, []);

  // Clear captured photo
  const clearPhoto = useCallback(() => {
    setCapturedPhoto(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cameraServiceRef.current.stopCamera();
    };
  }, []);

  return {
    videoRef,
    isInitialized,
    isLoading,
    error,
    capturedPhoto,
    initializeCamera,
    initializeCameraWithDevice,
    capturePhoto,
    switchCamera,
    stopCamera,
    getPhotoFile,
    clearPhoto,
    isSupported: CameraService.isSupported(),
  };
};